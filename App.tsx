
import React, { useState, useEffect } from 'react';
import { View, UserSG, RoundData, StaffLists, EquipmentType, UserRole, UserSpecialty, AuditLog } from './types';
import { Layout } from './components/Layout';
import { 
  LOCAL_STORAGE_KEY, 
  STAFF_LISTS_KEY, 
  LOGGED_USER_KEY, 
  EQUIPMENT_LABELS,
  EQUIPMENT_UNITS_MAP,
  SPECIALTY_EQUIPMENT 
} from './constants';
import { 
  GeneradoresForm, PropulsoresForm, FrigorificosForm, PAAForm,
  PurificadorForm, EngranajesForm, DesalinizadorasForm, ManejadorasForm,
  DeoilerForm, BowThrusterForm, AireComprimidoForm, GenericEquipmentForm 
} from './components/EquipmentForms';
import { QRScanner } from './components/QRScanner';
import { TrendsDashboard } from './components/TrendsDashboard';
import { SignaturePad } from './components/SignaturePad';
import { GuardStatus } from './components/GuardStatus';
import { AdminLists } from './components/AdminLists';
import { EquipmentHoursView } from './components/EquipmentHoursView';
import { AppGuide } from './components/AppGuide';
import { generateFormalPDF, exportDetailedCSV } from './services/reportService';
import { initDriveApi, authenticateDrive, isDriveLinked, uploadToDrive } from './services/driveService';

const getNavalGuardRange = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  let start = new Date(now);
  start.setMinutes(0, 0, 0);
  
  if (currentHour < 9) {
    start.setDate(start.getDate() - 1);
  }
  start.setHours(9);
  
  let end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(8);

  const toISOLocal = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  return {
    start: toISOLocal(start),
    end: toISOLocal(end),
    dateLabel: start.toISOString().split('T')[0]
  };
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.LOGIN);
  const [user, setUser] = useState<UserSG | null>(null);
  const [staffLists, setStaffLists] = useState<StaffLists>({ sg: [], sgi: [], ogi: [] });
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  
  const guardRange = getNavalGuardRange();

  const [sessionData, setSessionData] = useState({
    guardStart: guardRange.start,
    guardEnd: guardRange.end,
    ronda_de_inspeccion: `${new Date().getHours().toString().padStart(2, '0')}:00`,
    condicion: 'Puerto || Fondeado'
  });

  const [reportConfig, setReportConfig] = useState({
    date: guardRange.dateLabel,
    equipment: EquipmentType.GENERADORES
  });

  const [currentRound, setCurrentRound] = useState<Partial<RoundData>>({ on_off: 'y' });

  useEffect(() => {
    setCurrentOrigin(window.location.origin);
    const storedUser = localStorage.getItem(LOGGED_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setActiveView(View.DASHBOARD);
    }
    const storedStaff = localStorage.getItem(STAFF_LISTS_KEY);
    if (storedStaff) setStaffLists(JSON.parse(storedStaff));
    const storedRounds = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedRounds) setRounds(JSON.parse(storedRounds));

    initDriveApi().catch(err => console.error("Error GAPI:", err));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("¿Desea cerrar la sesión actual para realizar el cambio de usuario (Relevo)?")) {
      localStorage.removeItem(LOGGED_USER_KEY);
      setUser(null);
      setCurrentRound({ on_off: 'y' }); 
      setActiveView(View.LOGIN);
    }
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    
    const isHighRank = role === UserRole.CHIEF_ENGINEER || role === UserRole.CHIEF_GUARD;
    const specialty = isHighRank ? UserSpecialty.ALL : (formData.get('specialty') as UserSpecialty || UserSpecialty.PROPULSION);
    
    const newUser: UserSG = {
      grade: (formData.get('grade') as string).toUpperCase(),
      name: (formData.get('name') as string).toUpperCase(),
      password: formData.get('password') as string,
      role: role || UserRole.OPERATOR,
      specialty: specialty
    };

    const updatedStaff = { ...staffLists, sg: [...staffLists.sg, newUser] };
    setStaffLists(updatedStaff);
    localStorage.setItem(STAFF_LISTS_KEY, JSON.stringify(updatedStaff));
    
    setUser(newUser);
    localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(newUser));
    setActiveView(View.DASHBOARD);
    alert("Registro exitoso.");
  };

  const handleDriveSync = async () => {
    if (!isDriveConnected) {
      authenticateDrive();
      const checkInterval = setInterval(() => {
        if (isDriveLinked()) {
          setIsDriveConnected(true);
          clearInterval(checkInterval);
        }
      }, 1000);
      return;
    }

    setSyncing(true);
    try {
        const pdfBlob = await generateFormalPDF(rounds, reportConfig.date, reportConfig.equipment, false);
        if (pdfBlob) {
          const fileName = `REPORTE_${reportConfig.equipment.toUpperCase()}_GUARDIA_${reportConfig.date}.pdf`;
          const success = await uploadToDrive(pdfBlob, fileName, reportConfig.equipment);
          if (success) alert("Reporte sincronizado con Drive.");
          else alert("Error al subir archivo. Reintente.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        setSyncing(false);
    }
  };

  const finalizeSaveWithSignature = (signatureBase64: string) => {
    const isEditing = !!currentRound.UNIQUE_KEY;
    const guardStartDate = sessionData.guardStart.split('T')[0];
    
    // Si estamos editando, buscamos la versión anterior para la auditoría
    const previousVersion = isEditing ? rounds.find(r => r.UNIQUE_KEY === currentRound.UNIQUE_KEY) : null;

    let updatedRounds = [...rounds].filter(r => {
      if (isEditing) {
        return r.UNIQUE_KEY !== currentRound.UNIQUE_KEY;
      }
      return !(
        r.fecha === guardStartDate && 
        r.ronda_de_inspeccion === sessionData.ronda_de_inspeccion && 
        r.equipo_principal === currentRound.equipo_principal &&
        r.UNIDAD_ACTIVA === currentRound.UNIDAD_ACTIVA
      );
    });

    const auditTrail: AuditLog[] = previousVersion?.audit_trail || [];
    if (isEditing && previousVersion) {
      const { audit_trail, signature, ...oldData } = previousVersion;
      auditTrail.push({
        edited_by: `${user?.grade} ${user?.name} (${user?.role})`,
        edited_at: new Date().toLocaleString(),
        previous_values: oldData,
        reason: "Corrección de parámetros por Oficial/Jefe"
      });
    }

    const newRound: RoundData = {
      UNIQUE_KEY: currentRound.UNIQUE_KEY || `${Date.now()}`,
      fecha: currentRound.fecha || guardStartDate,
      ronda_de_inspeccion: sessionData.ronda_de_inspeccion,
      on_off: currentRound.on_off || 'y',
      condicion: sessionData.condicion,
      sg: isEditing ? previousVersion?.sg! : `${user?.grade} ${user?.name}`,
      equipo_principal: currentRound.equipo_principal!,
      EQUIPO_ACTIVO: EQUIPMENT_LABELS[currentRound.equipo_principal!],
      UNIDAD_ACTIVA: currentRound.UNIDAD_ACTIVA!,
      TIMESTAMP_GUARDADO: isEditing ? previousVersion?.TIMESTAMP_GUARDADO! : new Date().toLocaleString(),
      signature: signatureBase64 || previousVersion?.signature,
      audit_trail: auditTrail.length > 0 ? auditTrail : undefined,
      ...currentRound
    };

    updatedRounds.push(newRound);
    setRounds(updatedRounds);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRounds));
    alert(isEditing ? "Registro corregido y auditado correctamente." : "Certificado guardado correctamente.");
    setActiveView(View.GUARD_STATUS);
  };

  const renderEquipmentForm = () => {
    const previousRound = [...rounds].reverse().find(r => 
      r.equipo_principal === currentRound.equipo_principal && r.UNIDAD_ACTIVA === currentRound.UNIDAD_ACTIVA
    ) || null;

    const is0900 = sessionData.ronda_de_inspeccion === '09:00';
    const is0800 = sessionData.ronda_de_inspeccion === '08:00';
    const showHorometro = is0800 || is0900;
    const showTrim = is0800 || is0900;

    const commonProps = { 
        data: currentRound, 
        onChange: (e: any) => setCurrentRound(prev => ({ ...prev, [e.target.name]: e.target.value })), 
        showHorometro,
        showTrim,
        previousRound
    };

    switch(currentRound.equipo_principal) {
      case EquipmentType.GENERADORES: return <GeneradoresForm {...commonProps} />;
      case EquipmentType.PROPULSORES: return <PropulsoresForm {...commonProps} />;
      case EquipmentType.PAA: return <PAAForm {...commonProps} />;
      case EquipmentType.FRIGORIFICOS: return <FrigorificosForm {...commonProps} />;
      case EquipmentType.PURIFICADOR: return <PurificadorForm {...commonProps} />;
      case EquipmentType.ENGRANAJES: return <EngranajesForm {...commonProps} />;
      case EquipmentType.DESALINIZADORAS: return <DesalinizadorasForm {...commonProps} />;
      case EquipmentType.MANEJADORAS: return <ManejadorasForm {...commonProps} />;
      case EquipmentType.DEOILER: return <DeoilerForm {...commonProps} />;
      case EquipmentType.BOW_THRUSTER: return <BowThrusterForm {...commonProps} />;
      case EquipmentType.AIRE_COMPRIMIDO: return <AireComprimidoForm {...commonProps} />;
      default: return <GenericEquipmentForm {...commonProps} type={currentRound.equipo_principal as EquipmentType} />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setView={setActiveView} 
      user={user} 
      onLogout={handleLogout}
      canLogout={!!user}
    >
      
      {activeView === View.LOGIN && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-navy rounded-2xl flex items-center justify-center shadow-lg mb-4">
               <span className="text-white font-black text-2xl">SB</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center">Acceso Ingeniería</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">ARC Simón Bolívar</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const gradeName = formData.get('gradeName') as string;
            const password = formData.get('password') as string;
            
            if (gradeName === "ADMIN 1" && password === "123") {
                const adminUser: UserSG = { grade: 'ADMIN', name: '1', role: UserRole.CHIEF_ENGINEER, specialty: UserSpecialty.ALL };
                setUser(adminUser);
                localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(adminUser));
                setActiveView(View.DASHBOARD);
            } else {
                const found = staffLists.sg.find(u => `${u.grade} ${u.name}` === gradeName && u.password === password);
                if (found) {
                  const finalUser = { ...found };
                  if (finalUser.role === UserRole.CHIEF_ENGINEER || finalUser.role === UserRole.CHIEF_GUARD) {
                    finalUser.specialty = UserSpecialty.ALL;
                  }
                  setUser(finalUser);
                  localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(finalUser));
                  setActiveView(View.DASHBOARD);
                } else { 
                  alert("Usuario o contraseña incorrectos."); 
                }
            }
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Personal de Guardia</label>
              <select name="gradeName" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold outline-none focus:border-navy transition-all" required>
                <option value="">Seleccione...</option>
                <option value="ADMIN 1">ADMINISTRADOR (DEMO)</option>
                {staffLists.sg.map((u, i) => <option key={i} value={`${u.grade} ${u.name}`}>{u.grade} {u.name} ({u.specialty === UserSpecialty.PROPULSION ? 'Mot' : 'Ele'})</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
              <input name="password" type="password" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold outline-none focus:border-navy transition-all" placeholder="••••••••" required />
            </div>

            <button type="submit" className="w-full bg-navy text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all mt-4">
              Ingresar al Sistema
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">¿No está registrado?</p>
            <button 
              onClick={() => setActiveView(View.REGISTER_SG)}
              className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Registrar Nuevo Personal
            </button>
          </div>
        </div>
      )}

      {activeView === View.REGISTER_SG && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-500">
          <h2 className="text-xl font-black text-navy uppercase tracking-tight mb-2 text-center">Alta de Personal</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 text-center">Departamento de Ingeniería</p>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grado</label>
                <input name="grade" placeholder="Ej: ST" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold uppercase" required />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre</label>
                <input name="name" placeholder="Ej: PEREZ JUAN" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold uppercase" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rol</label>
              <select name="role" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold" required>
                <option value={UserRole.OPERATOR}>Operador S/G</option>
                <option value={UserRole.SG_ENGINEERING}>S/G Ingeniería</option>
                <option value={UserRole.CHIEF_GUARD}>Jefe de Guardia</option>
                <option value={UserRole.CHIEF_ENGINEER}>Ingeniero Jefe</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Especialidad</label>
              <select name="specialty" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold" required>
                <option value={UserSpecialty.PROPULSION}>Motorista (Propulsión)</option>
                <option value={UserSpecialty.ELECTRICITY}>Electricista (Electricidad)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
              <input name="password" type="password" placeholder="••••••••" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold" required />
            </div>

            <button type="submit" className="w-full bg-navy text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all mt-4">
              Registrar
            </button>
            <button 
              type="button" 
              onClick={() => setActiveView(View.LOGIN)} 
              className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest py-2"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {activeView === View.DASHBOARD && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-navy text-white p-8 pt-10 rounded-[2rem] shadow-2xl relative overflow-hidden pt-safe">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Guardia Activa</p>
                {isOfflineReady && (
                  <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Listo Offline
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold opacity-80">Inicio: {new Date(sessionData.guardStart).toLocaleString()}</span>
                <span className="text-sm font-bold opacity-80 text-blue-300">División: {user?.specialty === UserSpecialty.PROPULSION ? 'MOTORISTA' : user?.specialty === UserSpecialty.ELECTRICITY ? 'ELECTRICISTA' : 'GLOBAL'}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Ronda de Inspección</p>
                  <span className="text-3xl font-black text-white leading-none">TURNO: {sessionData.ronda_de_inspeccion} HS</span>
                </div>
                <button 
                  onClick={() => setActiveView(View.GENERAL_DATA)} 
                  className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Ajustar Turno
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard title="Matriz de Rondas" desc="Registro por Especialidad" icon="📋" color="bg-blue-50 text-blue-600" onClick={() => setActiveView(View.GUARD_STATUS)} />
            <DashboardCard title="Reporte de Horas" desc="Operación Diaria" icon="⏱️" color="bg-slate-50 text-navy" onClick={() => setActiveView(View.EQUIPMENT_HOURS)} />
            <DashboardCard title="Escanear QR" desc="Identificación Rápida" icon="📷" color="bg-indigo-50 text-indigo-600" onClick={() => setActiveView(View.QR_SCAN)} />
            <DashboardCard title="Sincronizar" desc="Cloud y Exportación" icon="☁️" color="bg-emerald-50 text-emerald-600" onClick={() => setActiveView(View.SYNC)} />
            <DashboardCard title="Tendencias" desc="IA Predictiva" icon="📈" color="bg-amber-50 text-amber-600" onClick={() => setActiveView(View.TENDENCIES)} />
            <DashboardCard title="Manual App" desc="Guía de Operación" icon="📖" color="bg-rose-50 text-rose-600" onClick={() => setActiveView(View.APP_GUIDE)} />
            {(user?.role === UserRole.CHIEF_ENGINEER || user?.role === UserRole.CHIEF_GUARD) && (
              <DashboardCard title="Personal" desc="Administrar Usuarios" icon="👥" color="bg-slate-50 text-slate-600" onClick={() => setActiveView(View.ADMIN_LISTS)} />
            )}
            <DashboardCard 
              title="Cambiar Usuario" 
              desc="Relevo de Guardia" 
              icon="🚪" 
              color="bg-slate-100 text-slate-600" 
              onClick={handleLogout} 
            />
          </div>
        </div>
      )}

      {activeView === View.EQUIPMENT_HOURS && (
        <EquipmentHoursView 
          onBack={() => setActiveView(View.DASHBOARD)} 
          isReliefContext={true}
          user={user}
          onConfirmed={() => {
            const guardDay = sessionData.guardStart.split('T')[0];
            localStorage.setItem(`hours_confirmed_${guardDay}_${user?.specialty}`, 'true');
            alert("Reporte de horas confirmado para su división.");
            setActiveView(View.GUARD_STATUS);
          }}
        />
      )}

      {activeView === View.APP_GUIDE && (
        <AppGuide onBack={() => setActiveView(View.DASHBOARD)} />
      )}

      {activeView === View.SYNC && (
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in duration-500">
            <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter leading-none">Gestión de Reportes</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Exportación y Sincronización en la Nube</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isDriveConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isDriveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {isDriveConnected ? 'Cloud Conectado' : 'Sin Conexión'}
                </div>
            </div>
            
            <div className="space-y-6 bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fecha de Guardia</label>
                    <input type="date" value={reportConfig.date} onChange={e => setReportConfig(p => ({...p, date: e.target.value}))} className="w-full border-2 border-white rounded-xl px-5 py-3 font-bold shadow-sm outline-none focus:border-navy" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Seleccione Sistema</label>
                    <select value={reportConfig.equipment} onChange={e => setReportConfig(p => ({...p, equipment: e.target.value as EquipmentType}))} className="w-full border-2 border-white rounded-xl px-5 py-3 font-bold shadow-sm bg-white outline-none focus:border-navy">
                      {(SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty] || Object.values(EquipmentType)).map(type => (
                        <option key={type} value={type}>{EQUIPMENT_LABELS[type]}</option>
                      ))}
                    </select>
                  </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={async () => await generateFormalPDF(rounds, reportConfig.date, reportConfig.equipment)} 
                    className="flex-1 bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                  >
                    Descargar PDF
                  </button>
                  <button 
                    onClick={handleDriveSync}
                    disabled={syncing}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${
                        isDriveConnected 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white border-2 border-blue-600 text-blue-600'
                    }`}
                  >
                    {syncing ? 'Sincronizando...' : (isDriveConnected ? 'Subir a Drive' : 'Vincular Google')}
                  </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Exportar Base de Datos</p>
                    <button onClick={async () => await exportDetailedCSV(rounds)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">Exportar CSV (Excel)</button>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Información de Origen</p>
                    <code className="text-[9px] font-bold text-blue-600 break-all">{currentOrigin}</code>
                </div>
            </div>

            <button onClick={() => setActiveView(View.DASHBOARD)} className="w-full text-slate-400 font-bold text-xs uppercase hover:text-navy transition-colors">Volver al Dashboard</button>
        </div>
      )}

      {activeView === View.GENERAL_DATA && (
        <div className="max-w-xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in duration-500">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Ajustar Guardia</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Configuración de Horarios de Relevo</p>
          </div>
          
          <div className="space-y-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Hora de Relevo (Inicio)</label>
              <input 
                type="datetime-local" 
                value={sessionData.guardStart} 
                onChange={e => setSessionData(p => ({...p, guardStart: e.target.value}))} 
                className="w-full border-2 border-white rounded-xl px-5 py-4 font-bold shadow-sm outline-none focus:border-navy" 
              />
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Hora de Entrega (Fin)</label>
              <input 
                type="datetime-local" 
                value={sessionData.guardEnd} 
                onChange={e => setSessionData(p => ({...p, guardEnd: e.target.value}))} 
                className="w-full border-2 border-white rounded-xl px-5 py-4 font-bold shadow-sm outline-none focus:border-navy" 
              />
            </div>
            
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 block px-1">Condición de la Unidad</label>
              <select 
                value={sessionData.condicion} 
                onChange={e => setSessionData(p => ({...p, condicion: e.target.value}))}
                className="w-full border-2 border-white rounded-xl px-5 py-4 font-bold shadow-sm outline-none focus:border-navy bg-white"
              >
                <option value="Puerto || Fondeado">Puerto || Fondeado</option>
                <option value="Navegación (Crucero)">Navegación (Crucero)</option>
                <option value="Navegación (Maniobra)">Navegación (Maniobra)</option>
                <option value="Astillero / Mantenimiento">Astillero / Mantenimiento</option>
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  alert("Configuración de guardia actualizada.");
                  setActiveView(View.DASHBOARD);
                }} 
                className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
              >
                Confirmar y Guardar
              </button>
              <button 
                onClick={() => setActiveView(View.DASHBOARD)} 
                className="w-full text-slate-400 font-bold text-xs uppercase hover:text-navy transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === View.ADMIN_LISTS && (
        <AdminLists staffLists={staffLists} setStaffLists={setStaffLists} onBack={() => setActiveView(View.DASHBOARD)} />
      )}

      {activeView === View.GUARD_STATUS && (
        <GuardStatus 
            rounds={rounds} 
            guardStart={sessionData.guardStart} 
            guardEnd={sessionData.guardEnd}
            activeHour={sessionData.ronda_de_inspeccion}
            user={user!}
            onSelectRound={(h, e, u, existingRound) => {
                const guardDay = sessionData.guardStart.split('T')[0];
                const isConfirmed = localStorage.getItem(`hours_confirmed_${guardDay}_${user?.specialty}`) === 'true';

                if (h === '09:00' && !isConfirmed) {
                    alert(`BLOQUEO OPERATIVO: Es OBLIGATORIO completar y confirmar el Reporte de Horas Diarias antes de iniciar la ronda de las 09:00 AM.`);
                    setActiveView(View.EQUIPMENT_HOURS);
                    return;
                }

                setSessionData(p => ({...p, ronda_de_inspeccion: h}));
                if (existingRound) {
                   setCurrentRound({ ...existingRound });
                } else {
                   setCurrentRound({ on_off: 'y', equipo_principal: e as EquipmentType, UNIDAD_ACTIVA: u });
                }
                setActiveView(View.EQUIPMENT_LOGGING);
            }}
            onBack={() => setActiveView(View.DASHBOARD)}
        />
      )}

      {activeView === View.EQUIPMENT_LOGGING && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-slate-100">
           <div className="mb-10 border-b border-slate-50 pb-8 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    {currentRound.UNIQUE_KEY ? 'MODO CORRECCIÓN (AUDITADO)' : `Ronda ${sessionData.ronda_de_inspeccion} HS`}
                  </p>
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">{EQUIPMENT_LABELS[currentRound.equipo_principal!] || 'Seleccione Equipo'}</h2>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">{currentRound.UNIDAD_ACTIVA}</span>
                </div>
                {currentRound.audit_trail && (
                  <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Historial: {currentRound.audit_trail.length} ediciones</span>
                  </div>
                )}
           </div>
           {renderEquipmentForm()}
           <div className="flex gap-4 pt-10">
              <button onClick={() => setActiveView(View.GUARD_STATUS)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Volver</button>
              <button onClick={() => setActiveView(View.ANALYSIS)} className="flex-1 bg-navy text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl">
                {currentRound.UNIQUE_KEY ? 'Finalizar Corrección' : 'Verificar Parámetros'}
              </button>
           </div>
        </div>
      )}

      {activeView === View.ANALYSIS && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">✓</div>
            <h2 className="text-2xl font-black text-navy uppercase mb-4 tracking-tighter">Parámetros Validados</h2>
            <p className="text-sm text-slate-500 mb-10 font-medium">Los datos se encuentran dentro de los rangos operacionales normales.</p>
            <button onClick={() => {
              if (currentRound.UNIQUE_KEY) {
                // Si es corrección, no requerimos firma nueva si ya tiene una, pero auditamos
                finalizeSaveWithSignature(currentRound.signature || "");
              } else {
                setActiveView(View.SIGNATURE);
              }
            }} className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest hover:scale-[1.02] transition-all">
              {currentRound.UNIQUE_KEY ? 'Aplicar Corrección Auditada' : 'Certificar con Firma'}
            </button>
            <button onClick={() => setActiveView(View.EQUIPMENT_LOGGING)} className="w-full mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest">Corregir Lecturas</button>
        </div>
      )}

      {activeView === View.SIGNATURE && <SignaturePad onSave={finalizeSaveWithSignature} onCancel={() => setActiveView(View.ANALYSIS)} />}
      
      {activeView === View.QR_SCAN && <QRScanner onScan={(txt) => {
          const parts = txt.trim().split(':');
          if (parts.length >= 2) {
            const equipmentType = Object.values(EquipmentType).find(v => v === parts[0].toLowerCase().trim() || v.replace(/_/g, '') === parts[0].toLowerCase().trim().replace(/_/g, ''));
            if (equipmentType) {
              const validUnits = EQUIPMENT_UNITS_MAP[equipmentType] || [];
              const matchedUnit = validUnits.find(u => u.toLowerCase().includes(parts[1].trim().toLowerCase())) || validUnits[0];
              setCurrentRound({ on_off: 'y', equipo_principal: equipmentType, UNIDAD_ACTIVA: matchedUnit });
              setActiveView(View.EQUIPMENT_LOGGING);
            }
          }
      }} onClose={() => setActiveView(View.DASHBOARD)} />}
      
      {activeView === View.TENDENCIES && <TrendsDashboard rounds={rounds} user={user!} onBack={() => setActiveView(View.DASHBOARD)} />}
    </Layout>
  );
};

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-xl transition-all active:scale-95 group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 ${color}`}>{icon}</div>
    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{title}</h3>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{desc}</p>
  </button>
);

export default App;

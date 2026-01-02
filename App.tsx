
import React, { useState, useEffect } from 'react';
import { View, UserSG, RoundData, StaffLists, EquipmentType, UserRole } from './types';
import { Layout } from './components/Layout';
import { 
  LOCAL_STORAGE_KEY, 
  STAFF_LISTS_KEY, 
  LOGGED_USER_KEY, 
  ROUND_TIMES, 
  EQUIPMENT_LABELS,
  EQUIPMENT_UNITS_MAP 
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
import { generateFormalPDF, exportDetailedCSV } from './services/reportService';
import { initDriveApi, authenticateDrive, isDriveLinked, uploadToDrive } from './services/driveService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.LOGIN);
  const [user, setUser] = useState<UserSG | null>(null);
  const [staffLists, setStaffLists] = useState<StaffLists>({ sg: [], sgi: [], ogi: [] });
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  
  const DEFAULT_START = "2026-01-01T09:00";
  const DEFAULT_END = "2026-01-02T08:00";

  const [sessionData, setSessionData] = useState({
    guardStart: DEFAULT_START,
    guardEnd: DEFAULT_END,
    ronda_de_inspeccion: `${new Date().getHours().toString().padStart(2, '0')}:00`,
    condicion: 'Puerto || Fondeado'
  });

  const [reportConfig, setReportConfig] = useState({
    date: DEFAULT_START.split('T')[0],
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
    const newUser: UserSG = {
      grade: (formData.get('grade') as string).toUpperCase(),
      name: (formData.get('name') as string).toUpperCase(),
      password: formData.get('password') as string,
      role: (formData.get('role') as UserRole) || UserRole.OPERATOR
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
    const guardStartDate = sessionData.guardStart.split('T')[0];
    let updatedRounds = [...rounds].filter(r => !(
      r.fecha === guardStartDate && 
      r.ronda_de_inspeccion === sessionData.ronda_de_inspeccion && 
      r.equipo_principal === currentRound.equipo_principal &&
      r.UNIDAD_ACTIVA === currentRound.UNIDAD_ACTIVA
    ));

    const newRound: RoundData = {
      UNIQUE_KEY: `${Date.now()}`,
      fecha: guardStartDate,
      ronda_de_inspeccion: sessionData.ronda_de_inspeccion,
      on_off: currentRound.on_off || 'y',
      condicion: sessionData.condicion,
      sg: `${user?.grade} ${user?.name}`,
      equipo_principal: currentRound.equipo_principal!,
      EQUIPO_ACTIVO: EQUIPMENT_LABELS[currentRound.equipo_principal!],
      UNIDAD_ACTIVA: currentRound.UNIDAD_ACTIVA!,
      TIMESTAMP_GUARDADO: new Date().toLocaleString(),
      signature: signatureBase64,
      ...currentRound
    };

    updatedRounds.push(newRound);
    setRounds(updatedRounds);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRounds));
    alert("Certificado guardado correctamente.");
    setActiveView(View.GUARD_STATUS);
  };

  const renderEquipmentForm = () => {
    const previousRound = [...rounds].reverse().find(r => 
      r.equipo_principal === currentRound.equipo_principal && r.UNIDAD_ACTIVA === currentRound.UNIDAD_ACTIVA
    ) || null;

    const commonProps = { 
        data: currentRound, 
        onChange: (e: any) => setCurrentRound(prev => ({ ...prev, [e.target.name]: e.target.value })), 
        showHorometro: ['08:00', '09:00'].includes(sessionData.ronda_de_inspeccion), 
        showTrim: ['08:00', '09:00'].includes(sessionData.ronda_de_inspeccion),
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
                const adminUser = { grade: 'ADMIN', name: '1', role: UserRole.CHIEF_ENGINEER };
                setUser(adminUser);
                localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(adminUser));
                setActiveView(View.DASHBOARD);
            } else {
                const found = staffLists.sg.find(u => `${u.grade} ${u.name}` === gradeName && u.password === password);
                if (found) {
                  setUser(found);
                  localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(found));
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
                {staffLists.sg.map((u, i) => <option key={i} value={`${u.grade} ${u.name}`}>{u.grade} {u.name}</option>)}
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
                <input name="grade" placeholder="Ej: TK" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 font-bold uppercase" required />
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
          <div className="bg-navy text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Guardia Activa</p>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold opacity-80">Inicio: {new Date(sessionData.guardStart).toLocaleString()}</span>
                <span className="text-sm font-bold opacity-80">Fin: {new Date(sessionData.guardEnd).toLocaleString()}</span>
              </div>
              <div className="mt-4">
                 <span className="text-2xl font-black text-blue-300">TURNO: {sessionData.ronda_de_inspeccion} HS</span>
              </div>
            </div>
            <button onClick={() => setActiveView(View.GENERAL_DATA)} className="absolute bottom-6 right-8 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest">Ajustar Turno</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard title="Matriz de Rondas" desc="Registro de Parámetros" icon="📋" color="bg-blue-50 text-blue-600" onClick={() => setActiveView(View.GUARD_STATUS)} />
            <DashboardCard title="Escanear QR" desc="Identificación Rápida" icon="📷" color="bg-indigo-50 text-indigo-600" onClick={() => setActiveView(View.QR_SCAN)} />
            <DashboardCard title="Sincronizar" desc="Cloud y Exportación" icon="☁️" color="bg-emerald-50 text-emerald-600" onClick={() => {
                setReportConfig(prev => ({...prev, date: sessionData.guardStart.split('T')[0]}));
                setActiveView(View.SYNC);
            }} />
            <DashboardCard title="Tendencias" desc="IA Predictiva" icon="📈" color="bg-amber-50 text-amber-600" onClick={() => setActiveView(View.TENDENCIES)} />
            {user?.role === UserRole.CHIEF_ENGINEER && (
              <DashboardCard title="Personal" desc="Administrar Usuarios" icon="👥" color="bg-rose-50 text-rose-600" onClick={() => setActiveView(View.ADMIN_LISTS)} />
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

      {activeView === View.ADMIN_LISTS && (
        <AdminLists 
          staffLists={staffLists} 
          setStaffLists={setStaffLists} 
          onBack={() => setActiveView(View.DASHBOARD)} 
        />
      )}

      {activeView === View.SYNC && (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
            <div className="flex justify-between items-start mb-10">
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter leading-none">Gestión de Archivos</h2>
                <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isDriveConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isDriveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {isDriveConnected ? 'Drive Conectado' : 'Drive Pendiente'}
                </div>
            </div>
            
            <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fecha de Guardia</label>
                    <input type="date" value={reportConfig.date} onChange={e => setReportConfig(p => ({...p, date: e.target.value}))} className="w-full border-2 border-white rounded-xl px-5 py-3 font-bold shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Seleccione Equipo</label>
                    <select value={reportConfig.equipment} onChange={e => setReportConfig(p => ({...p, equipment: e.target.value as EquipmentType}))} className="w-full border-2 border-white rounded-xl px-5 py-3 font-bold shadow-sm bg-white">
                      {Object.entries(EQUIPMENT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => generateFormalPDF(rounds, reportConfig.date, reportConfig.equipment)} 
                    className="flex-1 bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
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
                    {syncing ? 'Subiendo...' : (isDriveConnected ? 'Subir a Drive' : 'Vincular Google')}
                  </button>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-4">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Exportar Base de Datos</p>
                <button onClick={async () => await exportDetailedCSV(rounds)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Exportar CSV (Excel)</button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Origen detectado para Google Cloud:</p>
               <code className="text-[10px] font-bold text-blue-600 break-all">{currentOrigin}</code>
               <p className="text-[8px] text-slate-400 mt-2">Copie esta URL y agréguela a 'Orígenes de JavaScript autorizados' en su consola de Google.</p>
            </div>

            <button onClick={() => setActiveView(View.DASHBOARD)} className="w-full text-slate-400 font-bold text-xs uppercase hover:text-navy transition-colors">Regresar</button>
        </div>
      )}

      {activeView === View.GENERAL_DATA && (
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl mx-auto border border-slate-100">
          <h2 className="text-2xl font-black text-navy mb-8 uppercase tracking-tighter">Ajustar Guardia</h2>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Hora de Relevo</label>
              <input type="datetime-local" value={sessionData.guardStart} onChange={e => setSessionData(p => ({...p, guardStart: e.target.value}))} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Hora de Entrega</label>
              <input type="datetime-local" value={sessionData.guardEnd} onChange={e => setSessionData(p => ({...p, guardEnd: e.target.value}))} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold" />
            </div>
            <button onClick={() => setActiveView(View.DASHBOARD)} className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Confirmar Cambios</button>
          </div>
        </div>
      )}

      {activeView === View.GUARD_STATUS && (
        <GuardStatus 
            rounds={rounds} 
            guardStart={sessionData.guardStart} 
            guardEnd={sessionData.guardEnd}
            activeHour={sessionData.ronda_de_inspeccion}
            onSelectRound={(h, e, u) => {
                setSessionData(p => ({...p, ronda_de_inspeccion: h}));
                setCurrentRound({ on_off: 'y', equipo_principal: e as EquipmentType, UNIDAD_ACTIVA: u });
                setActiveView(View.EQUIPMENT_LOGGING);
            }}
            onBack={() => setActiveView(View.DASHBOARD)}
        />
      )}

      {activeView === View.EQUIPMENT_LOGGING && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-slate-100">
           <div className="mb-10 border-b border-slate-50 pb-8">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ronda {sessionData.ronda_de_inspeccion} HS</p>
                <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">{EQUIPMENT_LABELS[currentRound.equipo_principal!] || 'Seleccione Equipo'}</h2>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">{currentRound.UNIDAD_ACTIVA}</span>
           </div>
           {renderEquipmentForm()}
           <div className="flex gap-4 pt-10">
              <button onClick={() => setActiveView(View.GUARD_STATUS)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Volver</button>
              <button onClick={() => setActiveView(View.ANALYSIS)} className="flex-1 bg-navy text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl">Verificar</button>
           </div>
        </div>
      )}

      {activeView === View.ANALYSIS && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
            <h2 className="text-2xl font-black text-navy uppercase mb-8">Parámetros Validados</h2>
            <button onClick={() => setActiveView(View.SIGNATURE)} className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest">Certificar con Firma</button>
            <button onClick={() => setActiveView(View.EQUIPMENT_LOGGING)} className="w-full mt-6 text-slate-400 font-bold text-xs uppercase">Corregir</button>
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
      {activeView === View.TENDENCIES && <TrendsDashboard rounds={rounds} onBack={() => setActiveView(View.DASHBOARD)} />}
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

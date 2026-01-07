
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
import { initDriveApi, uploadToDrive, performMasterSync } from './services/driveService';
import { saveToStorage, loadFromStorage, removeFromStorage } from './services/storageService';

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
  // DEBUG LOG
  React.useEffect(() => {
    console.log("[ARC_BOOT] 🚀 APP STARTED SUCCESSFULLY - LOGS ACTIVE");
  }, []);

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
  const [selectedExportTypes, setSelectedExportTypes] = useState<string[]>([]);

  useEffect(() => {
    setCurrentOrigin(window.location.origin);
    
    // ASYNC INITIALIZATION
    const initApp = async () => {
        try {
            const storedUser = await loadFromStorage<UserSG>(LOGGED_USER_KEY);
            if (storedUser) {
              setUser(storedUser);
              setActiveView(View.DASHBOARD);
            }
            const storedStaff = await loadFromStorage<StaffLists>(STAFF_LISTS_KEY);
            if (storedStaff) setStaffLists(storedStaff);
            const storedRounds = await loadFromStorage<RoundData[]>(LOCAL_STORAGE_KEY);
            if (storedRounds) setRounds(storedRounds);
            
            initDriveApi().then(() => {
                // Al iniciar, sincronizamos de inmediato si hay red
                triggerMasterSync(false); 
            }).catch(err => console.error("Error Drive Init:", err));
        } catch(e) {
            console.error("App Init Error:", e);
        }
    };
    initApp();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }
  }, []);

  // EFECTO DE AUTO-SINCRONIZACIÓN CADA 2 MINUTOS
  useEffect(() => {
    const timer = setInterval(() => {
        console.log("[Auto-Sync] Sincronizando en segundo plano...");
        triggerMasterSync(false); // false = Silencioso, no muestra alertas
    }, 120000); 

    return () => clearInterval(timer);
  }, [rounds, staffLists]);

  const triggerMasterSync = async (showAlerts = false, overrideStaff?: UserSG[], overrideRounds?: RoundData[]) => {
    try {
        // Use overrideRounds if provided (creating from fresh state), otherwise use current state
        const sourceRounds = overrideRounds || rounds;

        const sanitizedRounds = sourceRounds.map(r => {
           if (r.UNIQUE_KEY) return r;
           return {
             ...r,
             UNIQUE_KEY: `AUTO_${r.fecha}_${r.ronda_de_inspeccion.replace(':','')}_${r.equipo_principal}_${Math.random().toString(36).substr(2, 5)}`
           };
        });
        
        const staffToSend = overrideStaff || staffLists.sg;
        const masterData = await performMasterSync(sanitizedRounds, staffToSend);
// ...

  const handleDeleteRound = () => {
    if (!currentRound.UNIQUE_KEY) return;
    
    // Permission check
    if (user?.role !== UserRole.CHIEF_ENGINEER && user?.role !== UserRole.CHIEF_GUARD) {
        return alert("Permisos insuficientes. Solo Jefes pueden eliminar registros.");
    }

    if (!window.confirm("⚠️ ¿ESTÁ SEGURO DE ELIMINAR ESTE REPORTE?\n\nLa ronda regresará a estado 'Pendiente' y se sincronizará la eliminación.")) {
        return;
    }

    const updatedRounds = rounds.map(r => {
        if (r.UNIQUE_KEY === currentRound.UNIQUE_KEY) {
             // FORCE TIMESTAMP WIN: Add 5 seconds to ensure deletion overrides any simultaneous server state
            const newTs = Date.now() + 5000;
            return { ...r, isDeleted: true, lastUpdated: newTs };
        }
        return r;
    });

    setRounds(updatedRounds);
    saveToStorage(LOCAL_STORAGE_KEY, updatedRounds); // Async fire-and-forget OK here for UI responsiveness
    
    alert("Registro eliminado correctamente.");
    setActiveView(View.GUARD_STATUS);
    
    // Sync deletion immediately passing the NEW Ref
    triggerMasterSync(false, undefined, updatedRounds);
  };
// ... [rest of function same until handleDeleteRound] ...


        if (masterData) {
            // Actualizamos Rondas con patrón funcional para evitar estados viejos (stale)
            if (masterData.rounds) {
                setRounds(currentLocalRounds => {
                    // MERGE STRATEGY: Prefer Server Data, but keep Local-Only data (unsynced items)
                    const masterMap = new Map((masterData.rounds as RoundData[]).map(r => [r.UNIQUE_KEY, r]));
                    const merged = [...(masterData.rounds as RoundData[])];
                    
                    currentLocalRounds.forEach(r => {
                         // If local round has a key NOT present in master, assume it's a new unsynced round -> Keep it
                         if (r.UNIQUE_KEY && !masterMap.has(r.UNIQUE_KEY)) {
                             merged.push(r);
                         }
                    });

                    saveToStorage(LOCAL_STORAGE_KEY, merged);
                    return merged;
                });
            }

            // Actualizamos Personal con patrón funcional y MERGE
            if (masterData.staff) {
                setStaffLists(prev => {
                    const masterStaff = masterData.staff as UserSG[];
                    const localStaff = prev.sg;

                    // Helper for unique ID (Grade + Name)
                    const getUserId = (u: UserSG) => `${u.grade?.trim().toUpperCase()}_${u.name?.trim().toUpperCase()}`;
                    const masterIds = new Set(masterStaff.map(getUserId));
                    
                    let mergedSg = [...masterStaff];
                    
                    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
                    const now = Date.now();
                    
                    localStaff.forEach(u => {
                        // ZOMBIE PREVENTION for Staff
                        if (!masterIds.has(getUserId(u))) {
                             const lastUpdate = u.lastUpdated || 0;
                             if (now - lastUpdate < TWO_HOURS_MS) {
                                  mergedSg.push(u);
                             }
                        }
                    });
                    
                    // GARBAGE COLLECTION LOCAL: Eliminar física y definitivamente los registros marcados como borrados hace > 1 hora
                    const ONE_HOUR_MS = 60 * 60 * 1000;
                    // reuse 'now' from above
                    
                    mergedSg = mergedSg.filter(u => {
                        // Si está borrado y pasaron más de 1 hora, limpieza total local
                        if (u.isDeleted && u.lastUpdated && (now - u.lastUpdated > ONE_HOUR_MS)) {
                            return false; 
                        }
                        return true;
                    });

                    const updated = { ...prev, sg: mergedSg };
                    saveToStorage(STAFF_LISTS_KEY, updated);
                    return updated;
                });
            }
            
            // GARBAGE COLLECTION ROUNDS + ZOMBIE PREVENTION
            if (masterData.rounds) {
               setRounds(currentLocalRounds => { // Changed param name to match logic
                   const masterMap = new Map((masterData.rounds as RoundData[]).map(r => [r.UNIQUE_KEY, r]));
                   const merged = [...(masterData.rounds as RoundData[])];
                   
                   const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
                   const ONE_HOUR_MS = 60 * 60 * 1000;
                   const now = Date.now();

                   currentLocalRounds.forEach(r => {
                          // ZOMBIE PREVENTION LOGIC:
                          if (r.UNIQUE_KEY && !masterMap.has(r.UNIQUE_KEY)) {
                              const lastUpdate = r.lastUpdated || 0;
                              // If it's fresh (created/edited recently), we assume it's offline work waiting to upload.
                              if (now - lastUpdate < TWO_HOURS_MS) {
                                  merged.push(r);
                              } 
                              // Else: It's old and server doesn't have it -> Assume server Hard Deleted it -> Drop/Ignore
                          }
                   });
                   
                   // GARBAGE COLLECTION (Hard Delete Local)
                   const finalDocs = merged.filter(r => {
                       if (r.isDeleted && r.lastUpdated && (now - r.lastUpdated > ONE_HOUR_MS)) {
                           return false; 
                       }
                       return true;
                   });
                   return finalDocs;
               });
            }

            if (showAlerts) {
                const version = masterData.version || "V9_MASTER_OK";
                const roundsCount = masterData.rounds?.length || 0;
                const staffCount = masterData.staff?.length || 0;
                
                alert(`✅ SINCRO EXITOSA (${version})\n\n` +
                      `📊 Rondas en Nube: ${roundsCount}\n` +
                      `👥 Personal en Nube: ${staffCount}\n\n` +
                      `Su base de datos local ha sido actualizada.`);
            }
            return true;
        }
    } catch (e) {
        console.error("[App] Fallo en triggerMasterSync:", e);
    }
    
    if (showAlerts) alert("⚠️ Error de Sincronización. Verifique su conexión o la URL del Script.");
    return false;
  };

  const handleLogout = () => {
    if (window.confirm("¿Desea cerrar la sesión actual para realizar el cambio de usuario (Relevo)?")) {
      removeFromStorage(LOGGED_USER_KEY);
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
      specialty: specialty,
      isDeleted: false,
      lastUpdated: Date.now()
    };

    const updatedStaff = { ...staffLists, sg: [...staffLists.sg, newUser] };
    setStaffLists(updatedStaff);
    saveToStorage(STAFF_LISTS_KEY, updatedStaff);
    
    setUser(newUser);
    saveToStorage(LOGGED_USER_KEY, newUser);
    setActiveView(View.DASHBOARD);
    alert("Registro exitoso.");
    
    // SINCRONIZACIÓN INMEDIATA enviando la lista actualizada explícitamente
    triggerMasterSync(false, updatedStaff.sg);
  };

  const handleDriveSync = async () => {
    if (!isDriveConnected) {
      uploadToDrive(new Blob(['test'], {type:'text/plain'}), 'test.txt', 'DEBUG').then(success => {
          if (success) setIsDriveConnected(true);
      });
      return;
    }

    if (selectedExportTypes.length === 0) {
        alert("Por favor seleccione un sistema para subir a Drive.");
        return;
    }

    if (selectedExportTypes.length > 1) {
        alert("La carga a Drive solo admite un archivo a la vez. Por favor seleccione UN solo sistema.");
        return;
    }

    const typeToSync = selectedExportTypes[0];

    setSyncing(true);
    try {
        const pdfBlob = await generateFormalPDF(rounds, reportConfig.date, typeToSync, false);
        if (pdfBlob && !(Array.isArray(pdfBlob))) {
          const fileName = `REPORTE_${typeToSync.toUpperCase()}_GUARDIA_${reportConfig.date}.pdf`;
          const success = await uploadToDrive(pdfBlob as Blob, fileName, typeToSync);
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
      ...currentRound,
      lastUpdated: Date.now(),
      isDeleted: false
    };

    updatedRounds.push(newRound);
    setRounds(updatedRounds);
    saveToStorage(LOCAL_STORAGE_KEY, updatedRounds);
    alert(isEditing ? "Registro corregido y auditado correctamente." : "Certificado guardado correctamente.");
    setActiveView(View.GUARD_STATUS);
  };

  const handleDeleteRound = () => {
    if (!currentRound.UNIQUE_KEY) return;
    
    // Permission check
    if (user?.role !== UserRole.CHIEF_ENGINEER && user?.role !== UserRole.CHIEF_GUARD) {
        return alert("Permisos insuficientes. Solo Jefes pueden eliminar registros.");
    }

    if (!window.confirm("⚠️ ¿ESTÁ SEGURO DE ELIMINAR ESTE REPORTE?\n\nLa ronda regresará a estado 'Pendiente' y se sincronizará la eliminación.")) {
        return;
    }

    const updatedRounds = rounds.map(r => {
        if (r.UNIQUE_KEY === currentRound.UNIQUE_KEY) {
             // FORCE TIMESTAMP WIN: Add 5 seconds to ensure deletion overrides any simultaneous server state
            return { ...r, isDeleted: true, lastUpdated: Date.now() + 5000 };
        }
        return r;
    });

    setRounds(updatedRounds);
    saveToStorage(LOCAL_STORAGE_KEY, updatedRounds);
    
    alert("Registro eliminado correctamente.");
    setActiveView(View.GUARD_STATUS);
    
    // Sync deletion immediately
    triggerMasterSync(false, undefined, updatedRounds);
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
        previousRound,
        previousTime: previousRound?.ronda_de_inspeccion
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
      case EquipmentType.BOW_THRUSTER:
      case EquipmentType.TIMONES: return <BowThrusterForm {...commonProps} />;
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
            
            if (gradeName === "ADMIN 1" && password === "arcadmin_1") {
                const adminUser: UserSG = { grade: 'ADMIN', name: '1', role: UserRole.CHIEF_ENGINEER, specialty: UserSpecialty.ALL };
                setUser(adminUser);
                saveToStorage(LOGGED_USER_KEY, adminUser);
                setActiveView(View.DASHBOARD);
            } else {
                const found = staffLists.sg.find(u => `${u.grade} ${u.name}` === gradeName && u.password === password && !u.isDeleted);
                if (found) {
                  const finalUser = { ...found };
                  if (finalUser.role === UserRole.CHIEF_ENGINEER || finalUser.role === UserRole.CHIEF_GUARD) {
                    finalUser.specialty = UserSpecialty.ALL;
                  }
                  setUser(finalUser);
                  saveToStorage(LOGGED_USER_KEY, finalUser);
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
                {staffLists.sg.filter(u => !u.isDeleted).map((u, i) => <option key={i} value={`${u.grade} ${u.name}`}>{u.grade} {u.name} ({u.specialty === UserSpecialty.PROPULSION ? 'Mot' : 'Ele'})</option>)}
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
            <DashboardCard title="Tendencias" desc="Análisis Técnico" icon="📈" color="bg-amber-50 text-amber-600" onClick={() => setActiveView(View.TENDENCIES)} />
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
          rounds={rounds.filter(r => !r.isDeleted)}
          guardDate={sessionData.guardStart.split('T')[0]}
          onConfirmed={() => {
            const guardDay = sessionData.guardStart.split('T')[0];
            saveToStorage(`hours_confirmed_${guardDay}_${user?.specialty}`, 'true');
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
                    {isDriveConnected ? 'Cloud Bridge Activo' : 'Cloud Configuración'}
                </div>
            </div>
            
            <div className="space-y-6 bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fecha de Guardia</label>
                    <input type="date" value={reportConfig.date} onChange={e => setReportConfig(p => ({...p, date: e.target.value}))} className="w-full border-2 border-white rounded-xl px-5 py-3 font-bold shadow-sm outline-none focus:border-navy" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Seleccione Sistemas</label>
                    <div className="w-full border-2 border-white rounded-xl bg-white shadow-sm overflow-hidden flex flex-col max-h-60">
                      
                      {/* Select All / Deselect All Header */}
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Equipos Disponibles</span>
                         <button 
                           onClick={() => {
                             const isGlobalMode = ["Puerto", "Astillero"].some(c => sessionData.condicion.includes(c));
                             const availableTypes = (isGlobalMode || !SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty]) 
                                ? Object.values(EquipmentType) 
                                : SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty];

                             if (selectedExportTypes.length === availableTypes.length) {
                               setSelectedExportTypes([]);
                             } else {
                               setSelectedExportTypes(availableTypes);
                             }
                           }}
                           className="text-[9px] font-bold text-blue-600 hover:text-blue-800"
                         >
                           {(() => {
                              const isGlobalMode = ["Puerto", "Astillero"].some(c => sessionData.condicion.includes(c));
                              const availableTypes = (isGlobalMode || !SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty]) 
                                ? Object.values(EquipmentType) 
                                : SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty];
                              return selectedExportTypes.length === availableTypes.length ? 'Deseleccionar' : 'Seleccionar Todos';
                           })()}
                         </button>
                      </div>

                       {/* List */}
                       <div className="overflow-y-auto p-2 space-y-1">
                          {(() => {
                              const isGlobalMode = ["Puerto", "Astillero"].some(c => sessionData.condicion.includes(c));
                              const availableTypes = (isGlobalMode || !SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty]) 
                                ? Object.values(EquipmentType) 
                                : SPECIALTY_EQUIPMENT[user?.specialty as UserSpecialty];
                              
                              return availableTypes.map(type => {
                                 const hasData = rounds.some(r => r.equipo_principal === type && r.fecha === reportConfig.date && !r.isDeleted);
                                 const isSelected = selectedExportTypes.includes(type);
                                 return (
                                   <div 
                                     key={type} 
                                     onClick={() => {
                                       if (isSelected) {
                                         setSelectedExportTypes(prev => prev.filter(t => t !== type));
                                       } else {
                                         setSelectedExportTypes(prev => [...prev, type]);
                                       }
                                     }}
                                     className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                   >
                                      <div className="flex items-center gap-3">
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                            {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                                          </div>
                                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>{EQUIPMENT_LABELS[type]}</span>
                                      </div>
                                      <div title={hasData ? "Datos disponibles" : "Sin datos registrados"}>
                                        {hasData ? (
                                          <span className="text-emerald-500 text-xs">✔️</span>
                                        ) : (
                                          <span className="text-slate-300 text-xs">❓</span>
                                        )}
                                      </div>
                                   </div>
                                 )
                              });
                          })()}
                       </div>
                    </div>
                  </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={async () => {
                        if (selectedExportTypes.length === 0) {
                            alert("Por favor seleccione al menos un sistema para exportar.");
                            return;
                        }
                        await generateFormalPDF(rounds.filter(r => !r.isDeleted), reportConfig.date, selectedExportTypes)
                    }} 
                    className="flex-1 bg-navy text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                  >
                    Descargar PDF ({selectedExportTypes.length})
                  </button>
                  <button 
                    onClick={handleDriveSync}
                    disabled={syncing}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all bg-blue-600 text-white hover:bg-blue-700`}
                  >
                    {syncing ? 'Sincronizando...' : 'Subir Reporte PDF (Drive)'}
                  </button>
              </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Respaldar Base de Datos</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={async () => await exportDetailedCSV(rounds.filter(r=>!r.isDeleted))} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">Exportar CSV (Local)</button>
                       <button 
                        disabled={syncing}
                        onClick={async () => {
                          setSyncing(true);
                          try {
                            const success = await triggerMasterSync(true);
                            if (!success) alert("⚠️ No se pudo conectar con el servidor para sincronizar.");
                          } finally {
                            setSyncing(false);
                          }
                        }} 
                        className="w-full bg-blue-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                      >
                        {syncing ? 'Sincronizando...' : 'Sincronizar Cloud (Pull/Push)'}
                      </button>
                    </div>
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
        <AdminLists 
          staffLists={staffLists} 
          setStaffLists={setStaffLists} 
          onBack={() => setActiveView(View.DASHBOARD)} 
          triggerSync={(updatedList) => triggerMasterSync(false, updatedList?.sg)}
        />
      )}

      {activeView === View.GUARD_STATUS && (
        <GuardStatus 
            rounds={rounds.filter(r => !r.isDeleted)} 
            guardStart={sessionData.guardStart} 
            guardEnd={sessionData.guardEnd}
            activeHour={sessionData.ronda_de_inspeccion}
            user={user!}
            condicion={sessionData.condicion}
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
           <div className="flex flex-col gap-3 pt-10">
              <div className="flex gap-4">
                  <button onClick={() => setActiveView(View.GUARD_STATUS)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Volver</button>
                  <button onClick={() => setActiveView(View.ANALYSIS)} className="flex-1 bg-navy text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl">
                    {currentRound.UNIQUE_KEY ? 'Finalizar Corrección' : 'Verificar Parámetros'}
                  </button>
              </div>
              
              {currentRound.UNIQUE_KEY && (user?.role === UserRole.CHIEF_ENGINEER || user?.role === UserRole.CHIEF_GUARD) && (
                 <button 
                  onClick={handleDeleteRound}
                  className="w-full bg-rose-50 text-rose-500 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
                 >
                    ⚠️ Eliminar Reporte (Jefatura)
                 </button>
              )}
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
      
      {activeView === View.TENDENCIES && <TrendsDashboard rounds={rounds.filter(r => !r.isDeleted)} user={user!} condicion={sessionData.condicion} onBack={() => setActiveView(View.DASHBOARD)} />}
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


import React, { useState } from 'react';
import { UserSG, StaffLists, UserRole, UserSpecialty } from '../types';
import { STAFF_LISTS_KEY } from '../constants';

interface AdminListsProps {
  staffLists: StaffLists;
  setStaffLists: (lists: StaffLists) => void;
  onBack: () => void;
  triggerSync: (updatedList?: StaffLists) => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string, color: string }> = {
  [UserRole.OPERATOR]: { label: 'Operador', color: 'bg-blue-100 text-blue-700' },
  [UserRole.SG_ENGINEERING]: { label: 'S/G Ingeniería', color: 'bg-indigo-100 text-indigo-700' },
  [UserRole.CHIEF_GUARD]: { label: 'Jefe de Guardia', color: 'bg-amber-100 text-amber-700' },
  [UserRole.CHIEF_ENGINEER]: { label: 'Ingeniero Jefe', color: 'bg-rose-100 text-rose-700' }
};

const SPECIALTY_CONFIG: Record<UserSpecialty, { label: string, color: string }> = {
  [UserSpecialty.PROPULSION]: { label: 'Motorista', color: 'bg-slate-100 text-slate-700' },
  [UserSpecialty.ELECTRICITY]: { label: 'Electricista', color: 'bg-yellow-100 text-yellow-700' },
  [UserSpecialty.ALL]: { label: 'Todas', color: 'bg-navy text-white' }
};

export const AdminLists: React.FC<AdminListsProps> = ({ staffLists, setStaffLists, onBack, triggerSync }) => {
  const [newUser, setNewUser] = useState<Partial<UserSG>>({ 
    role: UserRole.OPERATOR, 
    specialty: UserSpecialty.PROPULSION 
  });
  
  // Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UserSG | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.grade || !newUser.name || !newUser.password) return alert("Complete todos los campos");

    const userToAdd: UserSG = {
      ...(newUser as UserSG),
      isDeleted: false,
      lastUpdated: Date.now()
    };

    const updated: StaffLists = {
      ...staffLists,
      sg: [...staffLists.sg, userToAdd]
    };
    
    saveAndSync(updated, "Usuario añadido correctamente.");
    setNewUser({ role: UserRole.OPERATOR, specialty: UserSpecialty.PROPULSION });
  };

  const handleDeleteUser = (index: number) => {
    if (!window.confirm("¿Está seguro de eliminar este usuario? Perderá acceso inmediato.")) return;
    
    const updatedSg = [...staffLists.sg];
    // SOFT DELETE: Mark as deleted instead of splicing
    const user = updatedSg[index];
    updatedSg[index] = { ...user, isDeleted: true, lastUpdated: Date.now() };
    
    const updated: StaffLists = { ...staffLists, sg: updatedSg };
    saveAndSync(updated, "Usuario eliminado correctamente.");
  };

  const startEditing = (index: number, user: UserSG) => {
    setEditingIndex(index);
    setEditForm({ ...user }); // Clone to avoid direct mutation
  };

  const handleSaveEdit = () => {
    if (!editForm || editingIndex === null) return;
    
    const updatedSg = [...staffLists.sg];
    updatedSg[editingIndex] = {
      ...editForm,
      lastUpdated: Date.now()
    };
    
    const updated: StaffLists = { ...staffLists, sg: updatedSg };
    saveAndSync(updated, "Usuario actualizado correctamente.");
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveAndSync = (updatedList: StaffLists, message: string) => {
    setStaffLists(updatedList);
    localStorage.setItem(STAFF_LISTS_KEY, JSON.stringify(updatedList));
    alert(message);
    triggerSync(updatedList);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Gestión de Personal</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Administración de Roles y Seguridad</p>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-navy font-black text-xs uppercase tracking-widest transition-colors">← Volver</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD USER FORM */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddUser} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-navy uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-navy text-white rounded-lg flex items-center justify-center text-[10px]">+</span>
              Nuevo Registro
            </h3>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Grado</label>
              <input 
                type="text" 
                placeholder="Ej: ST, TK, MT..." 
                className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-navy outline-none transition-all"
                value={newUser.grade || ''}
                onChange={e => setNewUser({...newUser, grade: e.target.value.toUpperCase()})}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Nombres y Apellidos" 
                className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-navy outline-none transition-all"
                value={newUser.name || ''}
                onChange={e => setNewUser({...newUser, name: e.target.value.toUpperCase()})}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Rol</label>
              <select 
                className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-navy outline-none transition-all"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{ROLE_CONFIG[role].label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Especialidad (División)</label>
              <select 
                className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-navy outline-none transition-all"
                value={newUser.specialty}
                onChange={e => setNewUser({...newUser, specialty: e.target.value as UserSpecialty})}
              >
                <option value={UserSpecialty.PROPULSION}>Motorista (Propulsión)</option>
                <option value={UserSpecialty.ELECTRICITY}>Electricista (Electricidad)</option>
                <option value={UserSpecialty.ALL}>Ingeniero Jefe (Todas)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
              <input 
                type="password" 
                className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-navy outline-none transition-all"
                value={newUser.password || ''}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                required
              />
            </div>

            <button type="submit" className="w-full bg-navy text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-navy/20 hover:scale-[1.02] active:scale-95 transition-all">
              Dar de Alta
            </button>
          </form>
        </div>

        {/* USER LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personal Registrado ({staffLists.sg.filter(u => !u.isDeleted).length})</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {staffLists.sg.map((u, i) => {
              if (u.isDeleted) return null; // Filter logic for Soft Deletes

              return (
              <div key={i} className={`bg-white p-5 rounded-3xl border transition-all relative ${editingIndex === i ? 'border-navy shadow-xl ring-4 ring-navy/10 z-10' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                
                {editingIndex === i && editForm ? (
                  // EDIT MODE
                  <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-navy tracking-widest">Editando Usuario</span>
                        <button onClick={() => setEditingIndex(null)} className="text-slate-400 hover:text-red-500 text-xs font-bold">Cancelar</button>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Grado</label>
                           <input value={editForm.grade} onChange={e => setEditForm({...editForm, grade: e.target.value.toUpperCase()})} className="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:border-navy outline-none" />
                        </div>
                        <div>
                           <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Nombre</label>
                           <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value.toUpperCase()})} className="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:border-navy outline-none" />
                        </div>
                        <div>
                           <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Rol</label>
                           <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as UserRole})} className="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:border-navy outline-none">
                              {Object.values(UserRole).map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Especialidad</label>
                           <select value={editForm.specialty} onChange={e => setEditForm({...editForm, specialty: e.target.value as UserSpecialty})} className="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:border-navy outline-none">
                              <option value={UserSpecialty.PROPULSION}>Motorista</option>
                              <option value={UserSpecialty.ELECTRICITY}>Electricista</option>
                              <option value={UserSpecialty.ALL}>Todas</option>
                           </select>
                        </div>
                        <div className="col-span-2">
                           <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Contraseña</label>
                           <input type="password" value={editForm.password || ''} onChange={e => setEditForm({...editForm, password: e.target.value})} className="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:border-navy outline-none" placeholder="Solo escribir si se desea cambiar" />
                        </div>
                     </div>
                     <button onClick={handleSaveEdit} className="w-full bg-navy text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Guardar Cambios</button>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${ROLE_CONFIG[u.role].color.replace('text-', 'bg-').replace('100', '500')} text-white shadow-lg`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-sm font-black text-navy uppercase leading-none mb-1">{u.grade} {u.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${ROLE_CONFIG[u.role].color}`}>
                                {ROLE_CONFIG[u.role].label}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${SPECIALTY_CONFIG[u.specialty].color}`}>
                                {SPECIALTY_CONFIG[u.specialty].label}
                              </span>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => startEditing(i, u)}
                              className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"
                              title="Editar Usuario"
                            >
                               ✎
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(i)}
                              className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all"
                              title="Eliminar Usuario"
                            >
                               ✕
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};

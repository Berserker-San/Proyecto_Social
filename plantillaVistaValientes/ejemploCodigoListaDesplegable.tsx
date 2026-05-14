const ValientesList: React.FC<{ valientes: Valiente[], onSelect: (id: string) => void, onBatchRegister: (batch: Valiente[]) => void }> = ({ valientes, onSelect }) => {
    // Re-inserting simplified ValientesList logic
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ program: 'ALL', macro: '', discipline: '', institution: '', status: 'ALL' });
    const [showFilters, setShowFilters] = useState(false);
    const filtered = useMemo(() => {
        return valientes.filter(v => {
            const matchesSearch = v.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgram = filters.program === 'ALL' || v.programs.includes(filters.program as any);
            return matchesSearch && matchesProgram;
        });
    }, [valientes, searchTerm, filters]);

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <header className="mb-6">
                <div className="flex justify-between items-end mb-4"><div><h1 className="text-2xl font-bold text-slate-800">Directorio Unificado</h1></div><div className="bg-white p-1 rounded-lg border flex"><button onClick={() => setFilters({...filters, program: 'ALL'})} className={`px-3 py-1 text-xs font-bold ${filters.program === 'ALL' ? 'bg-slate-800 text-white rounded' : 'text-slate-500'}`}>Todos</button><button onClick={() => setFilters({...filters, program: 'SOROCA'})} className={`px-3 py-1 text-xs font-bold flex gap-1 ${filters.program === 'SOROCA' ? 'bg-emerald-600 text-white rounded' : 'text-slate-500'}`}><SorocaIcon size={12}/> Soroca</button><button onClick={() => setFilters({...filters, program: 'TRIBU'})} className={`px-3 py-1 text-xs font-bold flex gap-1 ${filters.program === 'TRIBU' ? 'bg-indigo-600 text-white rounded' : 'text-slate-500'}`}><TribuIcon size={12}/> Tribu</button></div></div>
                <div className="flex gap-2 mb-4"><input type="text" placeholder="Buscar..." className="w-full pl-4 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border rounded-lg bg-white"><Filter size={18}/></button></div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50"><tr><th className="px-6 py-3 text-xs font-bold text-slate-500">Valiente</th><th className="px-6 py-3 text-xs font-bold text-slate-500">Contexto</th><th className="text-right px-6"></th></tr></thead><tbody>{filtered.map(v => (<tr key={v.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => onSelect(v.id)}><td className="px-6 py-3"><div className="flex items-center gap-3"><img src={v.photoUrl} className="w-8 h-8 rounded-full bg-slate-200"/> <div><p className="font-bold text-sm text-slate-800">{v.fullName}</p><p className="text-xs text-slate-500">{v.documentId}</p></div></div></td><td className="px-6 py-3"><div className="flex gap-1">{v.programs.includes('SOROCA') && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">{v.sorocaMacro}</span>}{v.programs.includes('TRIBU') && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{v.discipline}</span>}</div></td><td className="px-6 py-3 text-right"><ChevronRight size={16} className="text-slate-400"/></td></tr>))}</tbody></table></div>
            </header>
        </div>
    )
};

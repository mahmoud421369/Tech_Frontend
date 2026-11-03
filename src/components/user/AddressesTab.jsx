const REQUIRED_ADDR = ['state', 'city', 'street', 'building'];

const AddressesTab = memo(({ addresses, inUseIds, onCreate, onUpdate, onDelete, darkMode, t }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDR);
  const [mode, setMode] = useState('manual');
  const formOpen = editingId !== null;
  const isValid = REQUIRED_ADDR.every((k) => String(form[k] ?? '').trim().length > 0);
  const close = () => { setEditingId(null); setForm(EMPTY_ADDR); setMode('manual'); };
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onMap = useCallback((lat, lng) => setForm((f) => ({ ...f, latitude: clampCoord(lat, 90), longitude: clampCoord(lng, 180) })), []);
  const onMapAddress = useCallback((d) => setForm((f) => ({
    ...f,
    state: d.state || f.state,
    city: d.city || f.city,
    street: d.street || f.street,
    building: d.building || f.building,
  })), []);
  const submit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    const payload = {
      ...form,
      state: form.state.trim(), city: form.city.trim(), street: form.street.trim(), building: form.building.trim(), notes: form.notes.trim(),
      latitude: clampCoord(form.latitude, 90), longitude: clampCoord(form.longitude, 180),
    };
    if (editingId === 'new') onCreate(payload); else onUpdate(editingId, payload);
    close();
  };
  const startEdit = (a) => {
    setForm({ state: a.state, city: a.city, street: a.street, building: a.building, notes: a.notes || '', isDefault: !!a.isDefault, latitude: a.latitude || 0, longitude: a.longitude || 0 });
    setEditingId(a.id);
  };

  if (formOpen) {
    const fields = [['state', t('stateGovernorate'), FiGlobe], ['city', t('city'), FiNavigation], ['street', t('street'), FiMapPin], ['building', t('buildingApartment'), FiHome]];
    const addressFields = (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([k, label, Icon]) => <TextField key={k} label={label} icon={Icon} value={form[k]} onChange={upd(k)} maxLength={80} required />)}
        </div>
        <TextField as="textarea" rows={3} label={t('additionalNotes')} value={form.notes} onChange={upd('notes')} maxLength={300} />
      </div>
    );
    return (
      <form onSubmit={submit} className="nb-panel space-y-5 p-5 sm:p-8">
        <h2 className="text-lg font-extrabold sm:text-xl">{editingId === 'new' ? t('addAddress') : t('editAddress')}</h2>
        <div className="grid grid-cols-2 gap-2.5" role="tablist">
          {[['manual', FiList, t('addressInformation')], ['map', FiNavigation, t('pickOnMap')]].map(([m, Icon, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`nb-btn px-2 py-2.5 text-xs ${mode === m ? 'nb-btn-on' : ''}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {mode === 'manual' ? addressFields : (
          <div className="space-y-4">
            <Suspense fallback={<div className={MAP_FALLBACK_CLS} />}>
              <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={onMap} onAddress={onMapAddress} darkMode={darkMode} />
            </Suspense>
            <div className="grid grid-cols-2 gap-4">
              {COORD_FIELDS.map(([k, label, max]) => (
                <TextField key={k} label={label} icon={FiCompass} type="number" step="any" min={-max} max={max} value={form[k] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: clampCoord(parseFloat(e.target.value), max) }))} />
              ))}
            </div>
            <p className="nb-gray nb-line flex items-start gap-2 rounded-xl border-2 border-dotted p-3 text-xs font-semibold"><FiInfo className="nb-ic mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{t('manualAddressHint')}</p>
            {addressFields}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
          <span className="text-sm font-bold">{t('setDefaultAddress')}</span>
        </label>
        {!isValid && (
          <p role="status" className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <FiInfo aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" /> {t('fillRequiredFields', 'Fill in all required fields (*) to save')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Btn tone="soft" onClick={close} className="py-2.5 text-sm">{t('cancel')}</Btn>
          <Btn type="submit" disabled={!isValid} className="py-2.5 text-sm"><FiCheck className="h-4 w-4" /> {editingId === 'new' ? t('save') : t('update')}</Btn>
        </div>
      </form>
    );
  }

  return (
    <>
      <ActionBar><Btn onClick={() => setEditingId('new')} className="px-3 py-2 text-xs"><FiPlus className="h-3.5 w-3.5" /> {t('addAddress')}</Btn></ActionBar>
      {addresses.length === 0 ? (
        <EmptyState kind="pin" title={t('noAddresses')} subtitle={t('addressHint')} />
      ) : (
        <div className={CARDS_GRID_CLS}>
          {addresses.map((a, i) => {
            const inUse = inUseIds.has(String(a.id));
            const hasCoords = !!a.latitude && !!a.longitude;
            return (
              <CardShell key={a.id} index={i}>
                <div className="flex items-start gap-2.5">
                  <IconTile Icon={FiMapPin} tone="sky" className="h-11 w-11 !rounded-full" iconClassName="h-5 w-5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold">{a.street}, {a.building}</h3>
                    <p className="nb-muted truncate text-xs font-semibold">{a.city}, {a.state}</p>
                    {a.isDefault && <p className="nb-ic mt-1 flex items-center gap-1 text-[11px] font-extrabold"><FiCheckCircle className="h-3 w-3" /> {t('default')}</p>}
                  </div>
                </div>
                {!isEmpty(a.notes) && <p className="nb-gray line-clamp-2 rounded-lg px-2.5 py-1.5 text-xs italic">“{a.notes}”</p>}
                {hasCoords && (
                  <a href={directionsUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-extrabold underline underline-offset-4">
                    <FiExternalLink className="nb-ic h-3 w-3" /> {t('getDirections')}
                    <span dir="ltr" className="nb-muted ms-auto font-mono font-normal normal-case">{Number(a.latitude).toFixed(4)}, {Number(a.longitude).toFixed(4)}</span>
                  </a>
                )}
                <div className="nb-line mt-auto border-t-2 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Btn tone="soft" disabled={inUse} onClick={() => startEdit(a)} className="py-2 text-xs"><FiEdit2 className="h-3.5 w-3.5" /> {inUse ? t('inUse') : t('edit')}</Btn>
                    <Btn tone="danger" disabled={inUse} onClick={() => onDelete(a.id)} className="py-2 text-xs" aria-label={t('delete')}><FiTrash2 className="h-3.5 w-3.5" /> {t('delete')}</Btn>
                  </div>
                  {inUse && <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-500"><FiInfo className="h-3 w-3" /> {t('usedInActiveOrderRepair')}</p>}
                </div>
              </CardShell>
            );
          })}
        </div>
      )}
    </>
  );
});
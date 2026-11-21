import {
  INDIA_LOCATIONS,
  getAreasForCity,
  getCitiesForDistrict,
  getDistrictsForState,
} from './constants.ts';
import { useApp } from './AppContext.tsx';

interface LocationFieldsProps {
  stateValue: string;
  districtValue: string;
  cityValue: string;
  areaValue: string;
  onChange: (next: { state: string; district: string; city: string; area: string }) => void;
  requiredArea?: boolean;
}

export function LocationFields({
  stateValue,
  districtValue,
  cityValue,
  areaValue,
  onChange,
  requiredArea = false,
}: LocationFieldsProps) {
  const { t } = useApp();

  const districts = getDistrictsForState(stateValue);
  const cities = getCitiesForDistrict(stateValue, districtValue);
  const suggestedAreas = getAreasForCity(stateValue, districtValue, cityValue);

  const handleStateChange = (nextState: string) => {
    const nextDistricts = getDistrictsForState(nextState);
    const firstDist = nextDistricts[0]?.district || '';
    const nextCities = getCitiesForDistrict(nextState, firstDist);
    const firstCity = nextCities[0]?.city || '';
    onChange({
      state: nextState,
      district: firstDist,
      city: firstCity,
      area: '',
    });
  };

  const handleDistrictChange = (nextDist: string) => {
    const nextCities = getCitiesForDistrict(stateValue, nextDist);
    const firstCity = nextCities[0]?.city || '';
    onChange({
      state: stateValue,
      district: nextDist,
      city: firstCity,
      area: '',
    });
  };

  const handleCityChange = (nextCity: string) => {
    onChange({
      state: stateValue,
      district: districtValue,
      city: nextCity,
      area: '',
    });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.auth.selectState} *
        </label>
        <select
          value={stateValue}
          onChange={(e) => handleStateChange(e.target.value)}
          className={inputClass}
          required
        >
          {INDIA_LOCATIONS.map((s) => (
            <option key={s.state} value={s.state}>
              {s.state}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.auth.selectDistrict} *
        </label>
        <select
          value={districtValue}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">-- {t.auth.selectDistrict} --</option>
          {districts.map((d) => (
            <option key={d.district} value={d.district}>
              {d.district}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.auth.selectCity} *
        </label>
        <select
          value={cityValue}
          onChange={(e) => handleCityChange(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">-- {t.auth.selectCity} --</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.auth.areaLocality} {requiredArea ? '*' : ''}
        </label>
        <input
          type="text"
          list={`areas-${cityValue || 'default'}`}
          value={areaValue}
          onChange={(e) =>
            onChange({
              state: stateValue,
              district: districtValue,
              city: cityValue,
              area: e.target.value,
            })
          }
          placeholder={t.jobs.areaPlaceholder}
          className={inputClass}
          required={requiredArea}
        />
        <datalist id={`areas-${cityValue || 'default'}`}>
          {suggestedAreas.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

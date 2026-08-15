import LocationList from './locations/LocationList'
import ScheduleList from './schedules/ScheduleList'

export default function LocationsAndSchedules() {
  return (
    <div className="grid h-[calc(100vh-2rem)] min-h-[600px] gap-6 lg:grid-cols-2">
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto p-5">
          <LocationList />
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto p-5">
          <ScheduleList />
        </div>
      </div>
    </div>
  )
}

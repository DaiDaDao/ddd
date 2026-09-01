import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Circle,
  CircleStop,
  Coffee,
  Compass,
  Droplets,
  Download,
  Focus,
  Footprints,
  Gauge,
  Headphones,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  PenLine,
  PersonStanding,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
  Sunset,
  Target,
  UsersRound,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'
import { syncMetricJsonFiles, type MetricDirectoryHandle, type MetricSyncFile } from './metric-sync'
import { readPersistedState, writePersistedState } from './storage'

type ViewId = 'overview' | 'work' | 'growth' | 'rituals' | 'health'

interface NavigationItem {
  id: ViewId
  label: string
  caption: string
  icon: string
}

const metricFileNames: Record<ViewId, string> = {
  overview: 'dashboard.json',
  work: 'work.json',
  growth: 'growth.json',
  rituals: 'rituals.json',
  health: 'health.json',
}

type WorkProfileId = 'default' | 'yuanyuan'
type PassiveIncomeRange = 'day' | 'week' | 'month' | 'year'

const workProfileFileNames: Record<WorkProfileId, string> = {
  default: 'work.json',
  yuanyuan: 'work-yuanyuan.json',
}

interface TodoItem {
  id: string
  title: string
  tag: string
  due: string
  done: boolean
}

interface Habit {
  id: string
  name: string
  days: number
  lastRecordedDate: string
}

interface TodayStatus {
  label: string
  value: string
  unit: string
  caption: string
  hint: string
}

interface ModuleCard {
  id: ViewId
  eyebrow: string
  title: string
  description: string
  metric: string
  action: string
  icon: string
  tone: string
}

interface OverviewData {
  eyebrow: string
  title: string
  subtitle: string
  primaryAction: string
  secondaryAction: string
  focusLabel: string
  focusTitle: string
  focusBody: string
  focusButton: string
  focusQuote: string
  pulseLabel: string
  pulseValue: string
  pulseUnit: string
  pulseCaption: string
  pulseHint: string
  moduleCards: ModuleCard[]
  todo: {
    eyebrow: string
    title: string
    placeholder: string
    addLabel: string
    emptyLabel: string
    completeLabel: string
    items: TodoItem[]
  }
}

interface DashboardData {
  app: {
    name: string
    descriptor: string
    tagline: string
    date: string
    version: string
  }
  profile: {
    name: string
    initials: string
    role: string
    focus: string
  }
  navigation: NavigationItem[]
  overview: OverviewData
}

interface WorkState {
  id: string
  label: string
  detail: string
  icon: string
  tone: string
  isPaid: boolean
}

interface BuyItem {
  id: string
  name: string
  price: number
  note: string
  icon: string
  tone: string
}

interface WorkPeriod {
  start: string
  end: string
}

interface WorkData {
  profileLabel: string
  meta: Record<string, string>
  currency: string
  monthlySalary: number
  workPeriods: WorkPeriod[]
  initialElapsedSeconds: number
  startedAtLabel: string
  defaultStateId: string
  buyItems: BuyItem[]
  states: WorkState[]
  passiveIncome: PassiveIncomeEntry[]
}

interface PassiveIncomeEntry {
  date: string
  amount: number
}

interface GrowthDimension {
  id: string
  label: string
  short: string
  score: number
  target: number
  note: string
  icon: string
  tone: string
}

interface GrowthData {
  meta: Record<string, string>
  dimensions: GrowthDimension[]
  eventTypes: string[]
  normalScore: number
  maxScore: number
  events: GrowthEvent[]
  signals: {
    label: string
    value: string
    detail: string
    icon: string
    tone: string
  }[]
}

interface GrowthEvent {
  id: string
  date: string
  type: string
  dimensionId: string
  title: string
  points: number
  note: string
}

interface ChecklistItem {
  id: string
  label: string
  hint: string
  done: boolean
}

interface Checklist {
  id: string
  title: string
  subtitle: string
  category: string
  duration: string
  icon: string
  tone: string
  isDaily?: boolean
  items: ChecklistItem[]
}

interface RitualsData {
  meta: Record<string, string>
  checklists: Checklist[]
}

interface HealthRange {
  min: number
  max: number
  label: string
}

interface HealthItem {
  id: string
  name: string
  unit: string
  precision: number
  inputType?: 'number' | 'text'
  normalRange: HealthRange
}

interface HealthCategory {
  id: string
  name: string
  subtitle: string
  icon: string
  tone: string
  items: HealthItem[]
}

interface HealthResult {
  itemId: string
  value: number | string
}

interface HealthRecord {
  id: string
  date: string
  label: string
  categoryIds: string[]
  results: HealthResult[]
  doctorAdvice: string
  aiAdvice: string
}

interface HealthData {
  meta: Record<string, string>
  favoriteItemIds?: string[]
  categories: HealthCategory[]
  records: HealthRecord[]
  dailyBaseItems: HealthItem[]
  dailyBase: HealthDailyRecord[]
}

interface HealthDailyRecord {
  id: string
  date: string
  values: HealthResult[]
}

type HealthTab = 'daily' | 'review'

interface UiData {
  app: {
    brandMark: string
    navLabel: string
    desktopNavLabel: string
    mobileNavLabel: string
    closeProfileLabel: string
    profileTitle: string
    notificationLabel: string
    syncLabel: string
    syncTitle: string
    syncSuccessToast: string
    syncDownloadToast: string
    syncErrorToast: string
    resetLabel: string
    resetTitle: string
    resetConfirm: string
    resetSuccessToast: string
    resetErrorToast: string
    resetUnavailableTitle: string
    toastCloseLabel: string
    toastCloseTitle: string
    liveBadge: string
  }
  loading: {
    errorEyebrow: string
    errorTitle: string
    reloadLabel: string
    loadingEyebrow: string
    loadingTitle: string
    fallbackError: string
  }
  overview: {
    focusIndex: string
    liveBadge: string
    moduleEyebrow: string
    moduleTitle: string
    moduleAside: string
    startToast: string
    focusToast: string
    newTodoTag: string
    newTodoDue: string
    addTodoToast: string
    todayStatusLabel: string
    todayStatusValueLabel: string
    todayStatusUnitLabel: string
    todayStatusCaptionLabel: string
    todayStatusHintLabel: string
    habitsEyebrow: string
    habitsTitle: string
    habitPlaceholder: string
    habitAddLabel: string
    habitRecordedLabel: string
    habitEmptyLabel: string
    habitDaysUnit: string
    remainingTodoLabel: string
  }
  work: {
    dayUnit: string
    buyNameLabel: string
    buyNamePlaceholder: string
    buyPriceLabel: string
    buyAddLabel: string
    buyItemAddedToast: string
    profileSwitchLabel: string
    passiveIncomeEyebrow: string
    passiveIncomeTitle: string
    passiveIncomeHint: string
    passiveIncomeDateLabel: string
    passiveIncomeAmountLabel: string
    passiveIncomeSaveLabel: string
    passiveIncomeSavedToast: string
    passiveIncomeDailyLabel: string
    passiveIncomeEmpty: string
    passiveIncomeRangeDayLabel: string
    passiveIncomeRangeWeekLabel: string
    passiveIncomeRangeMonthLabel: string
    passiveIncomeRangeYearLabel: string
    durationUnits: {
      seconds: string
      minutes: string
      hours: string
    }
  }
  growth: {
    radarEyebrow: string
    radarTitle: string
    radarCaption: string
    radarSeriesLabel: string
    weeklyBadge: string
    weeklyRecordLabel: string
    weeklyRecordValue: string
    dimensionsEyebrow: string
    dimensionsTitle: string
    dimensionsAside: string
    signalEyebrow: string
    targetPrefix: string
    scoreUnit: string
    averageScoreLabel: string
    normalScoreLabel: string
    maxScoreLabel: string
    breakthroughLabel: string
    eventEyebrow: string
    eventTitle: string
    eventHint: string
    eventDateLabel: string
    eventTypeLabel: string
    eventDimensionLabel: string
    eventPointsLabel: string
    eventNameLabel: string
    eventNamePlaceholder: string
    eventNoteLabel: string
    eventNotePlaceholder: string
    addEventLabel: string
    eventSavedToast: string
    chartEyebrow: string
    chartTitle: string
    dailyLabel: string
    weeklyLabel: string
    monthlyLabel: string
    pointsUnit: string
    cumulativePointsLabel: string
    noChartData: string
    eventsEyebrow: string
    eventsTitle: string
    previousPageLabel: string
    nextPageLabel: string
    noEvents: string
  }
  rituals: {
    newChecklistLabel: string
    newChecklistTitlePlaceholder: string
    newChecklistActionPlaceholder: string
    createChecklistLabel: string
    cancelChecklistLabel: string
    createdChecklistToast: string
    todayCompletedLabel: string
    actionUnit: string
  }
}

interface MetricData {
  dashboard: DashboardData
  work: WorkData
  workYuanyuan: WorkData
  growth: GrowthData
  rituals: RitualsData
  health: HealthData
}

interface PersistedDashboardState {
  todos: TodoItem[]
  checklists: Checklist[]
  healthRecords: HealthRecord[]
  healthDailyRecords: HealthDailyRecord[]
  healthFavoriteItemIds: string[]
  workStateId: string
  passiveIncome: PassiveIncomeEntry[]
  buyItemsByProfile: Record<WorkProfileId, BuyItem[]>
  growthDimensions: GrowthDimension[]
  growthEvents: GrowthEvent[]
  todayStatus: TodayStatus
  habits: Habit[]
  dailyTaskSyncDate: string
}

interface WorkMetrics {
  workdaysInMonth: number
  paidSecondsPerDay: number
  dailyIncome: number
  salaryPerSecond: number
}

const iconMap: Record<string, LucideIcon> = {
  Activity,
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  CircleStop,
  Coffee,
  Compass,
  Focus,
  Footprints,
  Headphones,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  PenLine,
  PersonStanding,
  ShoppingBag,
  Sparkles,
  Sunset,
  Target,
  UsersRound,
  Zap,
  Droplets,
  Gauge,
}

async function fetchMetric<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(path)
  }
  return response.json() as Promise<T>
}

function MetricIcon({ name, size = 18, strokeWidth = 1.8 }: { name: string; size?: number; strokeWidth?: number }) {
  const IconComponent = iconMap[name] ?? Circle
  return <IconComponent size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

function formatWorkEstimate(totalSeconds: number, units: UiData['work']['durationUnits']) {
  if (totalSeconds < 60) return `${Math.ceil(totalSeconds)} ${units.seconds}`
  const minutes = Math.ceil(totalSeconds / 60)
  if (minutes < 60) return `${minutes} ${units.minutes}`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} ${units.hours} ${remainingMinutes} ${units.minutes}` : `${hours} ${units.hours}`
}

function countWeekdaysInMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const cursor = new Date(year, month, 1)
  let weekdays = 0

  while (cursor.getMonth() === month) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) weekdays += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  return weekdays
}

function getMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function calculatePaidSeconds(data: WorkData, date = new Date()) {
  const currentSeconds = (date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()
  return data.workPeriods.reduce((total, period) => {
    const startSeconds = getMinutes(period.start) * 60
    const endSeconds = getMinutes(period.end) * 60
    return total + Math.max(0, Math.min(currentSeconds, endSeconds) - startSeconds)
  }, 0)
}

function isWithinWorkHours(data: WorkData, date = new Date()) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes()
  return data.workPeriods.some((period) => currentMinutes >= getMinutes(period.start) && currentMinutes < getMinutes(period.end))
}

function calculateWorkMetrics(data: WorkData, date = new Date()): WorkMetrics {
  const workdaysInMonth = Math.max(countWeekdaysInMonth(date), 1)
  const paidSecondsPerDay = data.workPeriods.reduce((total, period) => {
    const durationMinutes = Math.max(getMinutes(period.end) - getMinutes(period.start), 0)
    return total + durationMinutes * 60
  }, 0)
  const safePaidSecondsPerDay = Math.max(paidSecondsPerDay, 1)

  return {
    workdaysInMonth,
    paidSecondsPerDay: safePaidSecondsPerDay,
    dailyIncome: data.monthlySalary / workdaysInMonth,
    salaryPerSecond: data.monthlySalary / (workdaysInMonth * safePaidSecondsPerDay),
  }
}

function formatDateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function getPassiveIncomeChartData(entries: PassiveIncomeEntry[], range: PassiveIncomeRange, referenceDate = new Date()) {
  const reference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const buckets: { key: string; label: string }[] = []

  if (range === 'day') {
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(reference)
      date.setDate(date.getDate() - offset)
      const key = formatDateInput(date)
      buckets.push({ key, label: key.slice(5) })
    }
  } else if (range === 'week') {
    const currentMonday = new Date(reference)
    const day = currentMonday.getDay() || 7
    currentMonday.setDate(currentMonday.getDate() - day + 1)
    for (let offset = 7; offset >= 0; offset -= 1) {
      const monday = new Date(currentMonday)
      monday.setDate(monday.getDate() - offset * 7)
      const key = formatDateInput(monday)
      buckets.push({ key, label: key.slice(5) })
    }
  } else if (range === 'month') {
    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - offset, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      buckets.push({ key, label: key })
    }
  } else {
    for (let offset = 5; offset >= 0; offset -= 1) {
      const key = String(reference.getFullYear() - offset)
      buckets.push({ key, label: key })
    }
  }

  const amounts = new Map<string, number>()
  for (const entry of entries) {
    const entryDate = new Date(`${entry.date}T00:00:00`)
    if (Number.isNaN(entryDate.getTime())) continue
    let key = entry.date
    if (range === 'week') {
      const monday = new Date(entryDate)
      const day = monday.getDay() || 7
      monday.setDate(monday.getDate() - day + 1)
      key = formatDateInput(monday)
    } else if (range === 'month') {
      key = entry.date.slice(0, 7)
    } else if (range === 'year') {
      key = entry.date.slice(0, 4)
    }
    amounts.set(key, (amounts.get(key) ?? 0) + entry.amount)
  }

  return buckets.map((bucket) => ({ label: bucket.label, amount: amounts.get(bucket.key) ?? 0 }))
}

function formatDashboardDate(date: Date) {
  const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day} · ${weekdays[date.getDay()]}`
}

function formatLifeTagline(date: Date) {
  const startDate = new Date(1995, 9, 4)
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (currentDate < startDate) return '今天是进入游戏的第0年0月0天'

  let years = currentDate.getFullYear() - startDate.getFullYear()
  let anniversary = new Date(startDate.getFullYear() + years, startDate.getMonth(), startDate.getDate())
  if (anniversary > currentDate) {
    years -= 1
    anniversary = new Date(startDate.getFullYear() + years, startDate.getMonth(), startDate.getDate())
  }

  let months = (currentDate.getFullYear() * 12 + currentDate.getMonth()) - (anniversary.getFullYear() * 12 + anniversary.getMonth())
  let monthAnchor = new Date(anniversary.getFullYear(), anniversary.getMonth() + months, anniversary.getDate())
  if (monthAnchor > currentDate) {
    months -= 1
    monthAnchor = new Date(anniversary.getFullYear(), anniversary.getMonth() + months, anniversary.getDate())
  }

  const days = Math.round((currentDate.getTime() - monthAnchor.getTime()) / 86400000)
  return `今天是进入游戏的第${years}年${months}月${days}天`
}

function formatHealthDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

function getHealthTrendData(records: HealthRecord[], itemId: string) {
  return records
    .flatMap((record) => {
      const result = record.results.find((entry) => entry.itemId === itemId)
      return result && typeof result.value === 'number' ? [{ date: record.label, sortDate: record.date, value: result.value }] : []
    })
    .sort((first, second) => first.sortDate.localeCompare(second.sortDate))
    .map(({ date, value }) => ({ date, value }))
}

function getDailyHealthTrendData(records: HealthDailyRecord[], itemId: string) {
  return records
    .flatMap((record) => {
      const result = record.values.find((entry) => entry.itemId === itemId)
      return result && typeof result.value === 'number' ? [{ date: formatHealthDate(record.date), sortDate: record.date, value: result.value }] : []
    })
    .sort((first, second) => first.sortDate.localeCompare(second.sortDate))
    .map(({ date, value }) => ({ date, value }))
}

function getLatestHealthResult(records: HealthRecord[] | HealthDailyRecord[], itemId: string) {
  return [...records]
    .sort((first, second) => second.date.localeCompare(first.date))
    .map((record) => 'results' in record ? record.results : record.values)
    .map((results) => results.find((entry) => entry.itemId === itemId))
    .find((result): result is HealthResult => Boolean(result))
}

function formatHealthValue(value: number | string | undefined, precision: number) {
  if (value === undefined) return '--'
  return typeof value === 'number' ? value.toFixed(precision) : value
}

function App() {
  const [metric, setMetric] = useState<MetricData | null>(null)
  const [ui, setUi] = useState<UiData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchMetric<UiData>('/metric/ui.json')
      .then((loadedUi) => {
        if (!active) return
        setUi(loadedUi)
        return Promise.all([
          fetchMetric<DashboardData>('/metric/dashboard.json'),
          fetchMetric<WorkData>('/metric/work.json'),
          fetchMetric<WorkData>('/metric/work-yuanyuan.json'),
          fetchMetric<GrowthData>('/metric/growth.json'),
          fetchMetric<RitualsData>('/metric/rituals.json'),
          fetchMetric<HealthData>('/metric/health.json'),
        ]).then(([dashboard, work, workYuanyuan, growth, rituals, health]) => {
          const today = new Date()
          const runtimeDashboard = {
            ...dashboard,
            app: {
              ...dashboard.app,
              date: formatDashboardDate(today),
              tagline: formatLifeTagline(today),
            },
          }
          if (active) setMetric({ dashboard: runtimeDashboard, work, workYuanyuan, growth, rituals, health })
        }).catch((caught: unknown) => {
          console.error(caught)
          if (active) setError(loadedUi.loading.fallbackError)
        })
      })
      .catch((caught: unknown) => {
        console.error(caught)
      })

    return () => {
      active = false
    }
  }, [metric])

  if (error && ui) {
    return (
      <main className="loading-screen">
        <div className="loading-card error-card">
          <div className="brand-mark">{ui.app.brandMark}</div>
          <p className="eyebrow">{ui.loading.errorEyebrow}</p>
          <h1>{ui.loading.errorTitle}</h1>
          <p>{error}</p>
          <button className="button button-primary" type="button" onClick={() => window.location.reload()}>
            <RotateCcw size={16} />
            {ui.loading.reloadLabel}
          </button>
        </div>
      </main>
    )
  }

  if (!ui) {
    return <main className="loading-screen" aria-busy="true"><div className="loading-card"><span className="loading-line" /></div></main>
  }

  if (!metric) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <div className="brand-mark loading-mark">{ui.app.brandMark}</div>
          <p className="eyebrow">{ui.loading.loadingEyebrow}</p>
          <h1>{ui.loading.loadingTitle}</h1>
          <span className="loading-line" />
        </div>
      </main>
    )
  }

  return <Dashboard metric={metric} ui={ui} />
}

function Dashboard({ metric, ui }: { metric: MetricData; ui: UiData }) {
  const [activeView, setActiveView] = useState<ViewId>('overview')
  const [workProfileId, setWorkProfileId] = useState<WorkProfileId>('default')
  const [todos, setTodos] = useState(metric.dashboard.overview.todo.items.filter((todo) => !todo.done))
  const [checklists, setChecklists] = useState(metric.rituals.checklists)
  const [healthRecords, setHealthRecords] = useState(metric.health.records)
  const [healthDailyRecords, setHealthDailyRecords] = useState(metric.health.dailyBase ?? [])
  const [healthFavoriteItemIds, setHealthFavoriteItemIds] = useState<string[]>(metric.health.favoriteItemIds ?? [])
  const [workStateId, setWorkStateId] = useState(metric.work.defaultStateId)
  const [passiveIncome, setPassiveIncome] = useState(metric.work.passiveIncome ?? [])
  const [buyItemsByProfile, setBuyItemsByProfile] = useState<Record<WorkProfileId, BuyItem[]>>({ default: metric.work.buyItems ?? [], yuanyuan: metric.workYuanyuan.buyItems ?? [] })
  const [growthDimensions, setGrowthDimensions] = useState(metric.growth.dimensions)
  const [growthEvents, setGrowthEvents] = useState(metric.growth.events ?? [])
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({ label: metric.dashboard.overview.pulseLabel, value: metric.dashboard.overview.pulseValue, unit: metric.dashboard.overview.pulseUnit, caption: metric.dashboard.overview.pulseCaption, hint: metric.dashboard.overview.pulseHint })
  const [habits, setHabits] = useState<Habit[]>([])
  const [dailyTaskSyncDate, setDailyTaskSyncDate] = useState('')
  const workData = workProfileId === 'yuanyuan' ? metric.workYuanyuan : metric.work
  const workMetrics = calculateWorkMetrics(workData)
  const [clockNow, setClockNow] = useState(() => new Date())
  const [newTodo, setNewTodo] = useState('')
  const [toast, setToast] = useState('')
  const [storageReady, setStorageReady] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const syncDirectoryRef = useRef<MetricDirectoryHandle | null>(null)
  const isMetricActionBusy = isSyncing || isResetting

  const currentWorkState = workData.states.find((state) => state.id === workStateId) ?? workData.states[0]
  const paidSeconds = Math.min(calculatePaidSeconds(workData, clockNow), workMetrics.paidSecondsPerDay)
  const workHoursActive = isWithinWorkHours(workData, clockNow)
  const dailyChecklistTemplate = metric.rituals.checklists.find((checklist) => checklist.isDaily)

  useEffect(() => {
    let active = true
    readPersistedState<PersistedDashboardState>('dashboard').then((storedState) => {
      if (!active) return
      if (storedState && Array.isArray(storedState.todos)) setTodos(storedState.todos.filter((todo) => !todo.done))
      if (storedState && Array.isArray(storedState.checklists)) {
        setChecklists(dailyChecklistTemplate && !storedState.checklists.some((checklist) => checklist.isDaily) ? [...storedState.checklists, { ...dailyChecklistTemplate, items: dailyChecklistTemplate.items.map((item) => ({ ...item })) }] : storedState.checklists)
      }
      if (storedState && Array.isArray(storedState.healthRecords)) setHealthRecords(storedState.healthRecords)
      if (storedState && Array.isArray(storedState.healthDailyRecords)) setHealthDailyRecords(storedState.healthDailyRecords)
      if (storedState && Array.isArray(storedState.healthFavoriteItemIds)) setHealthFavoriteItemIds(storedState.healthFavoriteItemIds)
      if (storedState && typeof storedState.workStateId === 'string') setWorkStateId(storedState.workStateId)
      if (storedState && Array.isArray(storedState.passiveIncome)) setPassiveIncome(storedState.passiveIncome)
      if (storedState && storedState.buyItemsByProfile && Array.isArray(storedState.buyItemsByProfile.default) && Array.isArray(storedState.buyItemsByProfile.yuanyuan)) setBuyItemsByProfile(storedState.buyItemsByProfile)
      if (storedState && Array.isArray(storedState.growthDimensions)) setGrowthDimensions(storedState.growthDimensions)
      if (storedState && Array.isArray(storedState.growthEvents)) setGrowthEvents(storedState.growthEvents)
      if (storedState && storedState.todayStatus) setTodayStatus(storedState.todayStatus)
      if (storedState && Array.isArray(storedState.habits)) setHabits(storedState.habits)
      if (storedState && typeof storedState.dailyTaskSyncDate === 'string') setDailyTaskSyncDate(storedState.dailyTaskSyncDate)
      setStorageReady(true)
    }).catch((caught: unknown) => {
      console.error(caught)
      if (active) setStorageReady(true)
    })

    return () => {
      active = false
    }
  }, [dailyChecklistTemplate])

  useEffect(() => {
    if (!storageReady) return
    void writePersistedState('dashboard', { todos, checklists, healthRecords, healthDailyRecords, healthFavoriteItemIds, workStateId, passiveIncome, buyItemsByProfile, growthDimensions, growthEvents, todayStatus, habits, dailyTaskSyncDate }).catch((caught: unknown) => console.error(caught))
  }, [storageReady, todos, checklists, healthRecords, healthDailyRecords, healthFavoriteItemIds, workStateId, passiveIncome, buyItemsByProfile, growthDimensions, growthEvents, todayStatus, habits, dailyTaskSyncDate])

  useEffect(() => {
    if (!storageReady) return
    const today = formatDateInput(clockNow)
    if (dailyTaskSyncDate === today) return
    const dailyChecklist = checklists.find((checklist) => checklist.isDaily)
    const syncTimer = window.setTimeout(() => {
      if (dailyChecklist) {
        setTodos((current) => [
          ...current.filter((todo) => !todo.id.startsWith('daily-')),
          ...dailyChecklist.items.map((item) => ({ id: `daily-${today}-${item.id}`, title: item.label, tag: dailyChecklist.title, due: '今天', done: false })),
        ])
      }
      setDailyTaskSyncDate(today)
    }, 0)
    return () => window.clearTimeout(syncTimer)
  }, [storageReady, clockNow, dailyTaskSyncDate, checklists])

  useEffect(() => {
    if (!storageReady || activeView !== 'work') return
    const timer = window.setInterval(() => {
      setClockNow(new Date())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [storageReady, activeView])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  function changeView(view: ViewId) {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleTodo(todoId: string) {
    setTodos((current) => current.filter((todo) => todo.id !== todoId))
  }

  function addTodo(title: string) {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setTodos((current) => [
      {
        id: `quick-${Date.now()}`,
        title: cleanTitle,
          tag: ui.overview.newTodoTag,
          due: ui.overview.newTodoDue,
        done: false,
      },
      ...current,
    ])
    setNewTodo('')
    setToast(ui.overview.addTodoToast)
  }

  function changeWorkState(stateId: string) {
    setWorkStateId(stateId)
    setToast(workData.meta.activeToast)
  }

  function switchWorkProfile(profileId: WorkProfileId) {
    if (profileId === workProfileId) return
    const nextWorkData = profileId === 'yuanyuan' ? metric.workYuanyuan : metric.work
    setWorkProfileId(profileId)
    setWorkStateId(nextWorkData.defaultStateId)
    setPassiveIncome(nextWorkData.passiveIncome ?? [])
    setClockNow(new Date())
  }

  function addBuyItem(item: BuyItem) {
    setBuyItemsByProfile((current) => ({ ...current, [workProfileId]: [item, ...current[workProfileId]] }))
    setToast(ui.work.buyItemAddedToast)
  }

  function addHabit(name: string) {
    const cleanName = name.trim()
    if (!cleanName) return
    setHabits((current) => [...current, { id: `habit-${Date.now()}`, name: cleanName, days: 0, lastRecordedDate: '' }])
  }

  function recordHabit(habitId: string) {
    const today = formatDateInput(clockNow)
    setHabits((current) => current.map((habit) => habit.id === habitId && habit.lastRecordedDate !== today ? { ...habit, days: habit.days + 1, lastRecordedDate: today } : habit))
  }

  function toggleChecklistItem(checklistId: string, itemId: string) {
    setChecklists((current) =>
      current.map((checklist) => {
        if (checklist.id !== checklistId) return checklist
        return {
          ...checklist,
          items: checklist.items.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
        }
      }),
    )
  }

  function addChecklist(title: string, firstAction: string) {
    const checklistId = `custom-${Date.now()}`
    const checklist: Checklist = {
      id: checklistId,
      title: title.trim(),
      subtitle: '从一个清晰动作开始，把方向留给今天。',
      category: '自定义',
      duration: '自定义',
      icon: 'ListChecks',
      tone: 'blue',
      items: [{ id: `${checklistId}-1`, label: firstAction.trim(), hint: '完成后，再添加下一步。', done: false }],
    }
    setChecklists((current) => [...current, checklist])
    setToast(ui.rituals.createdChecklistToast)
    return checklistId
  }

  function addHealthRecord(record: HealthRecord) {
    setHealthRecords((current) => [record, ...current].sort((first, second) => second.date.localeCompare(first.date)))
    setToast(metric.health.meta.savedToast)
  }

  function buildMetricSyncFile(view: ViewId): MetricSyncFile {
    switch (view) {
      case 'overview':
        return {
          name: metricFileNames.overview,
          value: {
            ...metric.dashboard,
            overview: {
              ...metric.dashboard.overview,
              pulseLabel: todayStatus.label,
              pulseValue: todayStatus.value,
              pulseUnit: todayStatus.unit,
              pulseCaption: todayStatus.caption,
              pulseHint: todayStatus.hint,
              todo: { ...metric.dashboard.overview.todo, items: todos.map(({ id, title, tag, due, done }) => ({ id, title, tag, due, done })) },
            },
          },
        }
      case 'work':
        return { name: workProfileFileNames[workProfileId], value: { ...workData, defaultStateId: workStateId, passiveIncome, buyItems: buyItemsByProfile[workProfileId] } }
      case 'growth':
        return { name: metricFileNames.growth, value: { ...metric.growth, dimensions: growthDimensions, events: growthEvents } }
      case 'rituals':
        return { name: metricFileNames.rituals, value: { ...metric.rituals, checklists } }
      case 'health':
        return { name: metricFileNames.health, value: { ...metric.health, favoriteItemIds: healthFavoriteItemIds, records: healthRecords, dailyBase: healthDailyRecords } }
    }
  }

  async function syncMetricFile() {
    if (isMetricActionBusy || !storageReady) return
    setIsSyncing(true)
    const file = buildMetricSyncFile(activeView)

    try {
      const result = await syncMetricJsonFiles([file], syncDirectoryRef.current ?? undefined)
      syncDirectoryRef.current = result.directory ?? null
      setToast(result.mode === 'directory' ? ui.app.syncSuccessToast : ui.app.syncDownloadToast)
    } catch (caught: unknown) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      console.error(caught)
      setToast(ui.app.syncErrorToast)
    } finally {
      setIsSyncing(false)
    }
  }

  async function resetCurrentMetricState() {
    if (isMetricActionBusy || !storageReady) return
    if (!window.confirm(ui.app.resetConfirm)) return
    setIsResetting(true)

    const nextState: PersistedDashboardState = {
      todos: todos.map((todo) => ({ ...todo })),
      checklists: checklists.map((checklist) => ({ ...checklist, items: checklist.items.map((item) => ({ ...item })) })),
      healthRecords: healthRecords.map((record) => ({ ...record, categoryIds: [...record.categoryIds], results: record.results.map((result) => ({ ...result })) })),
      healthDailyRecords: healthDailyRecords.map((record) => ({ ...record, values: record.values.map((value) => ({ ...value })) })),
      healthFavoriteItemIds: [...healthFavoriteItemIds],
      workStateId,
      passiveIncome: passiveIncome.map((entry) => ({ ...entry })),
      buyItemsByProfile: {
        default: buyItemsByProfile.default.map((item) => ({ ...item })),
        yuanyuan: buyItemsByProfile.yuanyuan.map((item) => ({ ...item })),
      },
      growthDimensions: growthDimensions.map((dimension) => ({ ...dimension })),
      growthEvents: growthEvents.map((event) => ({ ...event })),
      todayStatus: { ...todayStatus },
      habits: habits.map((habit) => ({ ...habit })),
      dailyTaskSyncDate,
    }

    try {
      const resetQuery = `?reset=${Date.now()}`
      switch (activeView) {
        case 'overview': {
          const source = await fetchMetric<DashboardData>(`/metric/${metricFileNames.overview}${resetQuery}`)
          nextState.todos = source.overview.todo.items.filter((todo) => !todo.done).map((todo) => ({ id: todo.id, title: todo.title, tag: todo.tag, due: todo.due, done: false }))
          nextState.todayStatus = { label: source.overview.pulseLabel, value: source.overview.pulseValue, unit: source.overview.pulseUnit, caption: source.overview.pulseCaption, hint: source.overview.pulseHint }
          break
        }
        case 'work': {
          const source = await fetchMetric<WorkData>(`/metric/${workProfileFileNames[workProfileId]}${resetQuery}`)
          nextState.workStateId = source.defaultStateId
          nextState.passiveIncome = (source.passiveIncome ?? []).map((entry) => ({ ...entry }))
          nextState.buyItemsByProfile[workProfileId] = (source.buyItems ?? []).map((item) => ({ ...item }))
          break
        }
        case 'growth': {
          const source = await fetchMetric<GrowthData>(`/metric/${metricFileNames.growth}${resetQuery}`)
          nextState.growthDimensions = source.dimensions.map((dimension) => ({ ...dimension }))
          nextState.growthEvents = (source.events ?? []).map((event) => ({ ...event }))
          break
        }
        case 'rituals': {
          const source = await fetchMetric<RitualsData>(`/metric/${metricFileNames.rituals}${resetQuery}`)
          nextState.checklists = source.checklists.map((checklist) => ({ ...checklist, items: checklist.items.map((item) => ({ ...item })) }))
          break
        }
        case 'health': {
          const source = await fetchMetric<HealthData>(`/metric/${metricFileNames.health}${resetQuery}`)
          nextState.healthRecords = source.records.map((record) => ({ ...record, categoryIds: [...record.categoryIds], results: record.results.map((result) => ({ ...result })) }))
          nextState.healthDailyRecords = (source.dailyBase ?? []).map((record) => ({ ...record, values: record.values.map((value) => ({ ...value })) }))
          nextState.healthFavoriteItemIds = source.favoriteItemIds ?? []
          break
        }
      }

      await writePersistedState('dashboard', nextState)
      setTodos(nextState.todos)
      setChecklists(nextState.checklists)
      setHealthRecords(nextState.healthRecords)
      setHealthDailyRecords(nextState.healthDailyRecords)
      setHealthFavoriteItemIds(nextState.healthFavoriteItemIds)
      setWorkStateId(nextState.workStateId)
      setPassiveIncome(nextState.passiveIncome)
      setBuyItemsByProfile(nextState.buyItemsByProfile)
      setGrowthDimensions(nextState.growthDimensions)
      setGrowthEvents(nextState.growthEvents)
      setTodayStatus(nextState.todayStatus)
      setHabits(nextState.habits)
      setDailyTaskSyncDate(nextState.dailyTaskSyncDate)
      setToast(ui.app.resetSuccessToast)
    } catch (caught: unknown) {
      console.error(caught)
      setToast(ui.app.resetErrorToast)
    } finally {
      setIsResetting(false)
    }
  }

  const activeNav = metric.dashboard.navigation.find((item) => item.id === activeView) ?? metric.dashboard.navigation[0]
  const currentMetricFileName = activeView === 'work' ? workProfileFileNames[workProfileId] : metricFileNames[activeView]
  const canResetCurrentView = true

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">{ui.app.brandMark}</div>
          <div>
            <strong>{metric.dashboard.app.name}</strong>
            <span>{metric.dashboard.app.descriptor}</span>
            <small className="brand-tagline">{metric.dashboard.app.tagline}</small>
          </div>
        </div>

        <div className="sidebar-rule" />
        <p className="nav-label">{ui.app.navLabel}</p>
        <nav className="desktop-nav" aria-label={ui.app.desktopNavLabel}>
          {metric.dashboard.navigation.map((item) => (
            <button
              className={`nav-item ${activeView === item.id ? 'is-active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => changeView(item.id)}
            >
              <MetricIcon name={item.icon} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.caption}</small>
              </span>
              {activeView === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-note">
            <Sparkles size={16} />
            <p>{metric.dashboard.profile.focus}</p>
          </div>
          <div className="profile-row">
            <div className="avatar">{metric.dashboard.profile.initials}</div>
            <div>
              <strong>{metric.dashboard.profile.name}</strong>
              <span>{metric.dashboard.profile.role}</span>
            </div>
            <button className="icon-button subtle-icon" type="button" aria-label={ui.app.closeProfileLabel} title={ui.app.profileTitle}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>{metric.dashboard.app.name}</span>
            <ChevronRight size={14} />
            <strong>{activeNav?.caption}</strong>
          </div>
          <div className="topbar-actions">
            <span className="date-stamp">{metric.dashboard.app.date}</span>
            <button
              className={`icon-button sync-button ${isSyncing ? 'is-syncing' : ''}`}
              type="button"
              aria-label={ui.app.syncLabel}
              aria-busy={isSyncing}
              title={`${ui.app.syncTitle} (${currentMetricFileName})`}
              onClick={() => void syncMetricFile()}
              disabled={isMetricActionBusy || !storageReady}
            >
              <Download size={17} />
            </button>
            <button
              className={`icon-button reset-button ${isResetting ? 'is-resetting' : ''}`}
              type="button"
              aria-label={ui.app.resetLabel}
              aria-busy={isResetting}
              title={canResetCurrentView ? `${ui.app.resetTitle} (${currentMetricFileName})` : ui.app.resetUnavailableTitle}
              onClick={() => void resetCurrentMetricState()}
              disabled={isMetricActionBusy || !storageReady || !canResetCurrentView}
            >
              <RotateCcw size={17} />
            </button>
            <button className="icon-button notification-button" type="button" aria-label={ui.app.notificationLabel} title={ui.app.notificationLabel}>
              <Bell size={17} />
              <span />
            </button>
            <div className="mobile-avatar avatar">{metric.dashboard.profile.initials}</div>
          </div>
        </header>

        <div className="content-wrap">
          {activeView === 'overview' && (
            <OverviewPage
              data={metric.dashboard.overview}
              ui={ui.overview}
              todayStatus={todayStatus}
              habits={habits}
              todos={todos}
              newTodo={newTodo}
              onNewTodoChange={setNewTodo}
              onAddTodo={addTodo}
              onToggleTodo={toggleTodo}
              onUpdateTodayStatus={setTodayStatus}
              onAddHabit={addHabit}
              onRecordHabit={recordHabit}
              onOpenView={changeView}
            />
          )}
          {activeView === 'work' && (
            <WorkPage
              data={workData}
              profileId={workProfileId}
              metrics={workMetrics}
              profileOptions={[metric.work, metric.workYuanyuan]}
              ui={ui.work}
              paidSeconds={paidSeconds}
              isWithinWorkHours={workHoursActive}
              passiveIncome={passiveIncome}
              buyItems={buyItemsByProfile[workProfileId]}
              currentState={currentWorkState}
              onChangeState={changeWorkState}
              onSwitchProfile={switchWorkProfile}
              onSavePassiveIncome={(entry) => {
                setPassiveIncome((current) => [...current.filter((item) => item.date !== entry.date), entry].sort((first, second) => second.date.localeCompare(first.date)))
                setToast(ui.work.passiveIncomeSavedToast)
              }}
              onAddBuyItem={addBuyItem}
            />
          )}
          {activeView === 'growth' && <GrowthPage data={metric.growth} ui={ui.growth} dimensions={growthDimensions} events={growthEvents} onAddEvent={(event) => {
            setGrowthDimensions((current) => current.map((dimension) => dimension.id === event.dimensionId ? { ...dimension, score: dimension.score + event.points } : dimension))
            setGrowthEvents((current) => [event, ...current].sort((first, second) => second.date.localeCompare(first.date)))
            setToast(ui.growth.eventSavedToast)
          }} />}
          {activeView === 'rituals' && (
            <RitualsPage
              data={metric.rituals}
              ui={ui.rituals}
              checklists={checklists}
              onToggleItem={toggleChecklistItem}
              onAddChecklist={addChecklist}
              onResetPage={() => void resetCurrentMetricState()}
            />
          )}
          {activeView === 'health' && (
            <HealthPage
              data={metric.health}
              records={healthRecords}
              dailyRecords={healthDailyRecords}
              favoriteItemIds={healthFavoriteItemIds}
              onSaveRecord={addHealthRecord}
              onToggleFavorite={(itemId) => setHealthFavoriteItemIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId])}
              onSaveDailyRecord={(record) => {
                setHealthDailyRecords((current) => [...current.filter((item) => item.date !== record.date), record].sort((first, second) => second.date.localeCompare(first.date)))
                setToast(metric.health.meta.dailyBaseSavedToast)
              }}
            />
          )}
        </div>
      </main>

      <nav className="mobile-nav" aria-label={ui.app.mobileNavLabel}>
        {metric.dashboard.navigation.map((item) => (
          <button
            className={`mobile-nav-item ${activeView === item.id ? 'is-active' : ''}`}
            key={item.id}
            type="button"
            onClick={() => changeView(item.id)}
          >
            <MetricIcon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          <button type="button" aria-label={ui.app.toastCloseLabel} title={ui.app.toastCloseTitle} onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function OverviewPage({
  data,
  ui,
  todayStatus,
  habits,
  todos,
  newTodo,
  onNewTodoChange,
  onAddTodo,
  onToggleTodo,
  onUpdateTodayStatus,
  onAddHabit,
  onRecordHabit,
  onOpenView,
}: {
  data: OverviewData
  ui: UiData['overview']
  todayStatus: TodayStatus
  habits: Habit[]
  todos: TodoItem[]
  newTodo: string
  onNewTodoChange: (value: string) => void
  onAddTodo: (value: string) => void
  onToggleTodo: (todoId: string) => void
  onUpdateTodayStatus: (status: TodayStatus) => void
  onAddHabit: (name: string) => void
  onRecordHabit: (habitId: string) => void
  onOpenView: (view: ViewId) => void
}) {
  return (
    <div className="page page-overview">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{data.eyebrow}</p>
          <h1>{data.title}</h1>
          <p className="lede">{data.subtitle}</p>
        </div>
        <div className="heading-actions">
          <button className="button button-primary" type="button" onClick={() => onOpenView('rituals')}>
            <Sparkles size={16} />
            {data.primaryAction}
          </button>
          <button className="icon-button large-icon" type="button" aria-label={data.secondaryAction} title={data.secondaryAction} onClick={() => onOpenView('work')}>
            <ArrowUpRight size={19} />
          </button>
        </div>
      </section>

      <div className="overview-grid">
        <section className="focus-panel panel-dark">
          <div className="focus-header">
            <span className="eyebrow light-eyebrow">{data.focusLabel}</span>
            <span className="focus-index">{ui.focusIndex}</span>
          </div>
          <div className="focus-copy">
            <h2>{data.focusTitle}</h2>
            <p>{data.focusBody}</p>
          </div>
          <div className="focus-footer">
            <button className="button button-light" type="button" onClick={() => onOpenView('rituals')}>
              {data.focusButton}
              <ArrowUpRight size={16} />
            </button>
            <span className="focus-quote">“{data.focusQuote}”</span>
          </div>
          <div className="focus-lines" aria-hidden="true" />
        </section>

        <section className="pulse-panel panel-paper">
          <div className="panel-topline">
            <span className="eyebrow">{todayStatus.label}</span>
            <span className="status-badge"><span className="status-dot" /> {ui.liveBadge}</span>
          </div>
          <form className="today-status-form" onSubmit={(event) => event.preventDefault()}>
            <label><span>{ui.todayStatusLabel}</span><input value={todayStatus.label} onChange={(event) => onUpdateTodayStatus({ ...todayStatus, label: event.target.value })} /></label>
            <label><span>{ui.todayStatusValueLabel}</span><input value={todayStatus.value} onChange={(event) => onUpdateTodayStatus({ ...todayStatus, value: event.target.value })} /></label>
            <label><span>{ui.todayStatusUnitLabel}</span><input value={todayStatus.unit} onChange={(event) => onUpdateTodayStatus({ ...todayStatus, unit: event.target.value })} /></label>
            <label><span>{ui.todayStatusCaptionLabel}</span><input value={todayStatus.caption} onChange={(event) => onUpdateTodayStatus({ ...todayStatus, caption: event.target.value })} /></label>
            <label><span>{ui.todayStatusHintLabel}</span><input value={todayStatus.hint} onChange={(event) => onUpdateTodayStatus({ ...todayStatus, hint: event.target.value })} /></label>
          </form>
          <div className="pulse-score">
            <strong>{todayStatus.value}</strong>
            <span>{todayStatus.unit}</span>
          </div>
          <p className="pulse-caption">{todayStatus.caption}</p>
          <div className="pulse-meter"><span style={{ width: `${Math.min(Math.max(Number(todayStatus.value) || 0, 0), 100)}%` }} /></div>
          <div className="pulse-foot">
            <span><Zap size={14} /> {todayStatus.hint}</span>
            <ArrowUpRight size={16} />
          </div>
        </section>
      </div>

      <div className="content-grid">
        <section className="panel todo-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{data.todo.eyebrow}</p>
              <h2>{data.todo.title}</h2>
            </div>
            <span className="progress-number">{todos.length}</span>
          </div>
          <div className="progress-row">
            <span>{ui.remainingTodoLabel}</span>
            <div className="thin-progress"><span style={{ width: `${todos.length ? 100 : 0}%` }} /></div>
            <span>{todos.length}</span>
          </div>
          <form className="todo-form" onSubmit={(event) => { event.preventDefault(); onAddTodo(newTodo) }}>
            <input value={newTodo} onChange={(event) => onNewTodoChange(event.target.value)} placeholder={data.todo.placeholder} aria-label={data.todo.placeholder} />
            <button className="icon-button add-button" type="submit" aria-label={data.todo.addLabel} title={data.todo.addLabel}><Plus size={18} /></button>
          </form>
          <div className="todo-list">
            {todos.length === 0 && <p className="empty-state">{data.todo.emptyLabel}</p>}
            {todos.map((todo) => (
              <button className={`todo-row ${todo.done ? 'is-done' : ''}`} key={todo.id} type="button" onClick={() => onToggleTodo(todo.id)}>
                <span className="todo-check">{todo.done && <Check size={14} strokeWidth={2.4} />}</span>
                <span className="todo-main"><strong>{todo.title}</strong><small>{todo.tag} · {todo.due}</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel habits-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{ui.habitsEyebrow}</p>
              <h2>{ui.habitsTitle}</h2>
            </div>
            <Footprints size={22} className="section-icon" />
          </div>
          <form className="habit-add-form" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem('habit') as HTMLInputElement; onAddHabit(input.value); input.value = '' }}><input name="habit" placeholder={ui.habitPlaceholder} required /><button className="icon-button add-button" type="submit" aria-label={ui.habitAddLabel} title={ui.habitAddLabel}><Plus size={18} /></button></form>
          <div className="habit-list">{habits.length ? habits.map((habit) => <button className={`habit-row ${habit.lastRecordedDate === formatDateInput(new Date()) ? 'is-recorded' : ''}`} type="button" key={habit.id} onClick={() => onRecordHabit(habit.id)} disabled={habit.lastRecordedDate === formatDateInput(new Date())}><span><strong>{habit.name}</strong><small>{habit.days} {ui.habitDaysUnit}</small></span><em>{habit.lastRecordedDate === formatDateInput(new Date()) ? `✔ ${ui.habitRecordedLabel}` : '+'}</em></button>) : <p className="empty-state">{ui.habitEmptyLabel}</p>}</div>
        </section>
      </div>

      <section className="module-section">
        <div className="section-heading module-heading">
          <div><p className="eyebrow">{data.moduleCards.length.toString().padStart(2, '0')} / {ui.moduleEyebrow}</p><h2>{ui.moduleTitle}</h2></div>
          <span className="section-aside">{ui.moduleAside}</span>
        </div>
        <div className="module-grid">
          {data.moduleCards.map((module) => (
            <button className={`module-card tone-panel-${module.tone}`} key={module.id} type="button" onClick={() => onOpenView(module.id)}>
              <div className="module-card-top"><span className="eyebrow">{module.eyebrow}</span><span className="module-icon"><MetricIcon name={module.icon} size={19} /></span></div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div className="module-card-foot"><strong>{module.metric}</strong><span>{module.action} <ArrowUpRight size={15} /></span></div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function WorkPage({
  data,
  profileId,
  profileOptions,
  metrics,
  ui,
  buyItems,
  paidSeconds,
  isWithinWorkHours: workHoursActive,
  passiveIncome,
  currentState,
  onChangeState,
  onSwitchProfile,
  onSavePassiveIncome,
  onAddBuyItem,
}: {
  data: WorkData
  profileId: WorkProfileId
  profileOptions: WorkData[]
  metrics: WorkMetrics
  ui: UiData['work']
  paidSeconds: number
  isWithinWorkHours: boolean
  passiveIncome: PassiveIncomeEntry[]
  buyItems: BuyItem[]
  currentState: WorkState
  onChangeState: (stateId: string) => void
  onSwitchProfile: (profileId: WorkProfileId) => void
  onSavePassiveIncome: (entry: PassiveIncomeEntry) => void
  onAddBuyItem: (item: BuyItem) => void
}) {
  const [passiveIncomeRange, setPassiveIncomeRange] = useState<PassiveIncomeRange>('day')
  const [selectedItemId, setSelectedItemId] = useState(buyItems[0]?.id ?? '')
  const selectedItem = buyItems.find((item) => item.id === selectedItemId) ?? buyItems[0]
  const earned = paidSeconds * metrics.salaryPerSecond
  const buyEstimate = selectedItem ? selectedItem.price / metrics.salaryPerSecond : 0
  const paidProgress = Math.min((paidSeconds / metrics.paidSecondsPerDay) * 100, 100)
  const passiveChartData = getPassiveIncomeChartData(passiveIncome, passiveIncomeRange)

  return (
    <div className="page page-work">
      <section className="page-heading">
        <div><p className="eyebrow">{data.meta.eyebrow}</p><h1>{data.meta.title}</h1><p className="lede">{data.meta.subtitle}</p></div>
        <div className="work-profile-switch" role="tablist" aria-label={ui.profileSwitchLabel}>
          {profileOptions.map((profile, index) => {
            const nextProfileId: WorkProfileId = index === 0 ? 'default' : 'yuanyuan'
            return <button className={profileId === nextProfileId ? 'is-active' : ''} type="button" role="tab" aria-selected={profileId === nextProfileId} key={nextProfileId} onClick={() => onSwitchProfile(nextProfileId)}>{profile.profileLabel}</button>
          })}
        </div>
        <div className="work-day-pill"><span className="live-dot" /><span>{workHoursActive ? data.meta.liveLabel : data.meta.pausedLabel}</span><strong>{data.currency} {metrics.dailyIncome.toFixed(2)} {ui.dayUnit}</strong></div>
      </section>

      <div className="work-hero-grid">
        <section className="earnings-card panel-dark">
          <div className="earnings-top"><span className="eyebrow light-eyebrow">{data.meta.salaryLabel}</span><span className={`earnings-status ${workHoursActive ? 'is-live' : ''}`}><span />{workHoursActive ? data.meta.liveLabel : data.meta.pausedLabel}</span></div>
          <div className="earnings-number"><span>{data.currency}</span><strong>{earned.toFixed(2)}</strong></div>
          <div className="rate-caption"><Zap size={15} /> {data.currency} {metrics.salaryPerSecond.toFixed(4)} {data.meta.perSecondUnit}</div>
          <div className="earnings-progress"><span style={{ width: `${paidProgress}%` }} /></div>
          <div className="earnings-foot"><span>{data.meta.elapsedLabel} <strong>{formatDuration(paidSeconds)}</strong></span><span>{data.meta.startedLabel} <strong>{data.startedAtLabel}</strong></span></div>
          <div className="earnings-grid-lines" aria-hidden="true" />
        </section>

        <section className="work-state-summary panel-paper">
          <div className="panel-topline"><span className="eyebrow">{data.meta.stateEyebrow}</span><MetricIcon name={currentState.icon} size={19} /></div>
          <div className={`state-summary-icon tone-${currentState.tone}`}><MetricIcon name={currentState.icon} size={25} /></div>
          <h2>{currentState.label}</h2>
          <p>{currentState.detail}</p>
          <div className="state-summary-rule" />
          <span className="summary-caption">{data.meta.stateHint}</span>
        </section>
      </div>

      <section className="panel buy-panel">
        <div className="section-heading buy-heading"><div><p className="eyebrow">{data.meta.buyEyebrow}</p><h2>{data.meta.buyTitle}</h2></div><p>{data.meta.buyHint}</p></div>
        <div className="buy-layout">
          <div className="buy-items">
            <form className="buy-add-form" onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const formData = new FormData(form)
              const name = String(formData.get('name') ?? '').trim()
              const price = Number(formData.get('price'))
              if (!name || !Number.isFinite(price) || price < 0) return
              const item: BuyItem = { id: `buy-${Date.now()}`, name, price, note: '', icon: 'ShoppingBag', tone: 'coral' }
              onAddBuyItem(item)
              setSelectedItemId(item.id)
              form.reset()
            }}>
              <label><span className="eyebrow">{ui.buyNameLabel}</span><input name="name" type="text" placeholder={ui.buyNamePlaceholder} required /></label>
              <label><span className="eyebrow">{ui.buyPriceLabel}</span><div className="buy-price-input"><input name="price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" required /><span>{data.currency}</span></div></label>
              <button className="button button-dark" type="submit"><Plus size={16} />{ui.buyAddLabel}</button>
            </form>
            {buyItems.map((item) => (
              <button className={`buy-item ${selectedItemId === item.id ? 'is-selected' : ''}`} key={item.id} type="button" onClick={() => setSelectedItemId(item.id)}>
                <span className={`buy-item-icon tone-${item.tone}`}><MetricIcon name={item.icon} size={19} /></span>
                <span className="buy-item-copy"><strong>{item.name}</strong>{item.note && <small>{item.note}</small>}</span>
                <span className="buy-item-price">{data.currency} {item.price}</span>
              </button>
            ))}
          </div>
          <div className="buy-result">
            <span className="eyebrow">{data.meta.selectLabel}</span>
            <div className="buy-result-title"><strong>{selectedItem?.name}</strong><span>{data.currency} {selectedItem?.price}</span></div>
            <p>{data.meta.secondsLabel}</p>
            <div className="buy-time">{formatWorkEstimate(buyEstimate, ui.durationUnits)}</div>
            <div className="buy-result-rule" />
            <div className="buy-result-meta"><span>{data.meta.priceLabel}</span><strong>{data.currency} {selectedItem?.price}</strong></div>
          </div>
        </div>
      </section>

      <section className="panel passive-income-panel">
        <div className="section-heading"><div><p className="eyebrow">{data.meta.passiveIncomeEyebrow}</p><h2>{data.meta.passiveIncomeTitle}</h2></div><div className="passive-income-heading-tools"><p className="section-aside">{data.meta.passiveIncomeHint}</p><div className="passive-income-range-tabs" role="tablist">{(['day', 'week', 'month', 'year'] as PassiveIncomeRange[]).map((range) => <button className={passiveIncomeRange === range ? 'is-active' : ''} type="button" role="tab" aria-selected={passiveIncomeRange === range} key={range} onClick={() => setPassiveIncomeRange(range)}>{ui[`passiveIncomeRange${range[0].toUpperCase()}${range.slice(1)}Label` as 'passiveIncomeRangeDayLabel' | 'passiveIncomeRangeWeekLabel' | 'passiveIncomeRangeMonthLabel' | 'passiveIncomeRangeYearLabel']}</button>)}</div></div></div>
        <div className="passive-income-layout">
          <form className="passive-income-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const formData = new FormData(form); const date = String(formData.get('date') ?? ''); const amount = Number(formData.get('amount')); if (date && Number.isFinite(amount) && amount >= 0) { onSavePassiveIncome({ date, amount }); form.reset(); } }}>
            <label><span className="eyebrow">{data.meta.passiveIncomeDateLabel}</span><input name="date" type="date" defaultValue={formatDateInput(new Date())} required /></label>
            <label><span className="eyebrow">{data.meta.passiveIncomeAmountLabel}</span><div className="passive-income-input"><input name="amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" required /><span>{data.currency}</span></div></label>
            <button className="button button-dark" type="submit"><Plus size={16} />{data.meta.passiveIncomeSaveLabel}</button>
          </form>
              <div className="passive-income-chart">
            {passiveChartData.some((entry) => entry.amount > 0) ? <ResponsiveContainer width="100%" height="100%"><LineChart data={passiveChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="#e5e3da" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#7b837d', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: '#7b837d', fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip /><Line type="monotone" dataKey="amount" name={data.meta.passiveIncomeDailyLabel} stroke="#e7a23b" strokeWidth={2} dot={{ fill: '#e7a23b', r: 3 }} /></LineChart></ResponsiveContainer> : <div className="health-chart-empty">{data.meta.passiveIncomeEmpty}</div>}
          </div>
        </div>
      </section>

      <section className="state-section">
        <div className="section-heading"><div><p className="eyebrow">{data.meta.stateEyebrow}</p><h2>{data.meta.stateTitle}</h2></div><p className="section-aside">{data.meta.stateHint}</p></div>
        <div className="state-grid">
          {data.states.map((state) => (
            <button className={`state-card tone-panel-${state.tone} ${state.id === currentState.id ? 'is-selected' : ''}`} key={state.id} type="button" onClick={() => onChangeState(state.id)} aria-pressed={state.id === currentState.id}>
              <div className="state-card-top"><span className="state-card-icon"><MetricIcon name={state.icon} size={20} /></span>{state.id === currentState.id && <span className="selected-mark"><Check size={13} /></span>}</div>
              <strong>{state.label}</strong>
              <span>{state.detail}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function HealthPage({
  data,
  records,
  dailyRecords,
  favoriteItemIds,
  onSaveRecord,
  onToggleFavorite,
  onSaveDailyRecord,
}: {
  data: HealthData
  records: HealthRecord[]
  dailyRecords: HealthDailyRecord[]
  onSaveRecord: (record: HealthRecord) => void
  favoriteItemIds: string[]
  onSaveDailyRecord: (record: HealthDailyRecord) => void
  onToggleFavorite: (itemId: string) => void
}) {
  const [date, setDate] = useState(formatDateInput(new Date()))
  const [activeTab, setActiveTab] = useState<HealthTab>('daily')
  const [isOtherTrendExpanded, setIsOtherTrendExpanded] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [doctorAdvice, setDoctorAdvice] = useState('')
  const [aiAdvice, setAiAdvice] = useState('')
  const [dailyDate, setDailyDate] = useState(formatDateInput(new Date()))
  const [dailyValues, setDailyValues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const selectedCategories = data.categories.filter((category) => selectedCategoryIds.includes(category.id))
  const selectedItems = selectedCategories.flatMap((category) => category.items)
  const trendItems = data.categories.flatMap((category) => category.items.map((item) => ({ category, item })))
  const dailyTrendItems = data.dailyBaseItems.map((item) => ({ category: undefined, item }))
  const currentTrendItems = activeTab === 'daily' ? dailyTrendItems : trendItems
  const favoriteTrendItems = currentTrendItems.filter(({ item }) => favoriteItemIds.includes(item.id))
  const otherTrendItems = currentTrendItems.filter(({ item }) => !favoriteItemIds.includes(item.id))

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId])
    setFormError('')
  }

  function updateValue(itemId: string, value: string) {
    setValues((current) => ({ ...current, [itemId]: value }))
    setFormError('')
  }

  function updateDailyValue(itemId: string, value: string) {
    setDailyValues((current) => ({ ...current, [itemId]: value }))
  }

  function handleDailySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = data.dailyBaseItems
      .filter((item) => dailyValues[item.id]?.trim() !== '')
      .map((item) => ({ itemId: item.id, value: Number(dailyValues[item.id]) }))
      .filter((entry) => Number.isFinite(entry.value))
    if (!values.length) return
    onSaveDailyRecord({ id: `daily-${dailyDate}`, date: dailyDate, values })
    setDailyValues({})
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCategoryIds.length) {
      setFormError(data.meta.missingCategoryToast)
      return
    }

    const hasMissingValue = selectedItems.some((item) => values[item.id]?.trim() === '')
    if (hasMissingValue) {
      setFormError(data.meta.missingValueToast)
      return
    }

    const hasInvalidNumber = selectedItems.some((item) => (item.inputType ?? 'number') === 'number' && !Number.isFinite(Number(values[item.id])))
    if (hasInvalidNumber) {
      setFormError(data.meta.missingValueToast)
      return
    }

    onSaveRecord({
      id: `review-${date}-${records.length + 1}`,
      date,
      label: formatHealthDate(date),
      categoryIds: selectedCategoryIds,
      results: selectedItems.map((item) => ({ itemId: item.id, value: item.inputType === 'text' ? values[item.id] : Number(values[item.id]) })),
      doctorAdvice: doctorAdvice.trim(),
      aiAdvice: aiAdvice.trim(),
    })
    setSelectedCategoryIds([])
    setValues({})
    setDoctorAdvice('')
    setAiAdvice('')
    setFormError('')
  }

  function getCategoryNames(categoryIds: string[]) {
    return categoryIds
      .map((categoryId) => data.categories.find((category) => category.id === categoryId)?.name)
      .filter((name): name is string => Boolean(name))
      .join(' · ')
  }

  function renderTrendCard(category: HealthCategory | undefined, item: HealthItem, sourceRecords: HealthRecord[] | HealthDailyRecord[], isDaily: boolean) {
    const isFavorite = favoriteItemIds.includes(item.id)
    const trendData = isDaily ? getDailyHealthTrendData(sourceRecords as HealthDailyRecord[], item.id) : getHealthTrendData(sourceRecords as HealthRecord[], item.id)
    const latestResult = getLatestHealthResult(sourceRecords, item.id)
    const canShowTrend = isFavorite && item.inputType !== 'text' && typeof latestResult?.value === 'number' && trendData.length > 0
    return (
      <article className={`panel health-trend-card ${isFavorite ? 'is-favorite' : ''}`} key={item.id}>
        <div className="health-trend-top">
          <div>
            {category && <span className={`health-trend-dot tone-${category.tone}`} />}
            <span className="eyebrow">{category?.name ?? 'DAILY BASELINE'}</span>
          </div>
          <button className={`health-favorite-button ${isFavorite ? 'is-favorite' : ''}`} type="button" aria-label={`${isFavorite ? data.meta.unfavoriteLabel : data.meta.favoriteLabel}${item.name}`} title={`${isFavorite ? data.meta.unfavoriteLabel : data.meta.favoriteLabel}${item.name}`} onClick={() => onToggleFavorite(item.id)}>
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="health-trend-title"><h3>{item.name}</h3><span>{data.meta.normalLabel} {item.normalRange.label}</span></div>
        <div className={`health-latest-value ${canShowTrend ? '' : 'is-latest-only'}`}><span>{data.meta.latestLabel}</span><strong>{formatHealthValue(latestResult?.value, item.precision)} <small>{item.unit}</small></strong></div>
        {canShowTrend && (
          <div className="health-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#e5e3da" strokeDasharray="3 3" vertical={false} /><ReferenceArea y1={item.normalRange.min} y2={item.normalRange.max} fill="#dce9dd" fillOpacity={0.65} /><XAxis dataKey="date" tick={{ fill: '#7b837d', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: '#7b837d', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#e86647" strokeWidth={2.5} dot={{ fill: '#e86647', r: 3 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
        )}
      </article>
    )
  }

  function renderTrendSection(sourceRecords: HealthRecord[] | HealthDailyRecord[], isDaily: boolean) {
    return (
      <section className="health-trends">
        <div className="section-heading health-trends-heading"><div><p className="eyebrow">{data.meta.trendEyebrow}</p><h2>{data.meta.trendTitle}</h2></div><p className="section-aside">{data.meta.trendHint}</p></div>
        <section className="health-favorite-group">
          <div className="health-subsection-heading"><div><span className="eyebrow">{data.meta.favoriteLabel}</span><p>{data.meta.favoriteHint}</p></div><span>{favoriteTrendItems.length}</span></div>
          {favoriteTrendItems.length ? <div className="health-trend-grid">{favoriteTrendItems.map(({ category, item }) => renderTrendCard(category, item, sourceRecords, isDaily))}</div> : <p className="health-empty-note">{data.meta.favoriteEmpty}</p>}
        </section>
        {otherTrendItems.length > 0 && (
          <section className="health-other-group">
            <button className="health-other-toggle" type="button" aria-expanded={isOtherTrendExpanded} onClick={() => setIsOtherTrendExpanded((expanded) => !expanded)}><span><span className="eyebrow">{data.meta.otherLabel}</span><small>{otherTrendItems.length} {data.meta.itemCountUnit}</small></span><ChevronDown size={17} className={isOtherTrendExpanded ? 'is-expanded' : ''} /></button>
            {isOtherTrendExpanded && <div className="health-trend-grid">{otherTrendItems.map(({ category, item }) => renderTrendCard(category, item, sourceRecords, isDaily))}</div>}
          </section>
        )}
      </section>
    )
  }

  return (
    <div className="page page-health">
      <section className="page-heading">
        <div><p className="eyebrow">{data.meta.eyebrow}</p><h1>{data.meta.title}</h1><p className="lede">{data.meta.subtitle}</p></div>
        <div className="health-summary"><strong>{data.categories.length.toString().padStart(2, '0')}</strong><span>{data.meta.categoriesUnit}</span><em>{records.length} {data.meta.recordsUnit}</em></div>
      </section>

      <div className="health-tabs" role="tablist" aria-label={data.meta.trendTitle}>
        <button className={activeTab === 'daily' ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === 'daily'} onClick={() => { setActiveTab('daily'); setIsOtherTrendExpanded(false) }}>{data.meta.dailyTabLabel}</button>
        <button className={activeTab === 'review' ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === 'review'} onClick={() => { setActiveTab('review'); setIsOtherTrendExpanded(false) }}>{data.meta.reviewTabLabel}</button>
      </div>

      {activeTab === 'daily' ? <>
        <form className="panel daily-base-panel" onSubmit={handleDailySubmit}>
        <div className="section-heading"><div><p className="eyebrow">{data.meta.dailyBaseEyebrow}</p><h2>{data.meta.dailyBaseTitle}</h2></div><span className="section-aside">{data.meta.dailyBaseHint}</span></div>
        <div className="daily-base-top"><label><span className="eyebrow">{data.meta.dateLabel}</span><input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} required /></label><button className="button button-primary" type="submit"><Check size={16} />{data.meta.dailyBaseSaveLabel}</button></div>
        <div className="daily-base-grid">{data.dailyBaseItems.map((item) => <label className="health-result-field" key={item.id}><span><strong>{item.name}</strong><small>{item.normalRange.label} {item.unit}</small></span><div className="health-input-wrap"><input type="number" inputMode="decimal" step={item.precision ? 10 ** -item.precision : 1} value={dailyValues[item.id] ?? ''} onChange={(event) => updateDailyValue(item.id, event.target.value)} placeholder="--" /><em>{item.unit}</em></div></label>)}</div>
        </form>
        {renderTrendSection(dailyRecords, true)}
      </> : <>

      <div className="health-layout">
        <form className="panel health-form" onSubmit={handleSubmit}>
          <div className="section-heading health-form-heading"><div><p className="eyebrow">{data.meta.recordEyebrow}</p><h2>{data.meta.recordTitle}</h2></div><span className="section-aside">{data.meta.recordHint}</span></div>

          <label className="health-date-field">
            <span className="eyebrow">{data.meta.dateLabel}</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>

          <div className="health-form-section">
            <div className="health-section-title"><strong>{data.meta.categoryLabel}</strong><span>{data.meta.categoryHint}</span></div>
            <div className="health-category-grid">
              {data.categories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id)
                return (
                  <label className={`health-category-option tone-panel-${category.tone} ${isSelected ? 'is-selected' : ''}`} key={category.id}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCategory(category.id)} />
                    <span className={`health-category-icon tone-${category.tone}`}><MetricIcon name={category.icon} size={19} /></span>
                    <span className="health-category-copy"><strong>{category.name}</strong><small>{category.subtitle}</small></span>
                    <span className="health-category-count">{category.items.length} {data.meta.itemCountUnit}</span>
                    {isSelected && <Check size={16} className="health-category-check" />}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="health-form-section">
            <div className="health-section-title"><strong>{data.meta.resultLabel}</strong><span>{selectedItems.length ? `${selectedItems.length} ${data.meta.itemCountUnit}` : data.meta.categoryHint}</span></div>
            {selectedItems.length ? (
              <div className="health-result-grid">
                {selectedItems.map((item) => (
                  <label className="health-result-field" key={item.id}>
                    <span><strong>{item.name}</strong><small>{data.meta.normalLabel} {item.normalRange.label} {item.unit}</small></span>
                    <div className="health-input-wrap"><input type={item.inputType ?? 'number'} inputMode={item.inputType === 'text' ? 'text' : 'decimal'} step={item.inputType === 'text' ? undefined : item.precision ? 10 ** -item.precision : 1} value={values[item.id] ?? ''} onChange={(event) => updateValue(item.id, event.target.value)} required /><em>{item.unit}</em></div>
                  </label>
                ))}
              </div>
            ) : <p className="health-empty-note">{data.meta.categoryHint}</p>}
          </div>

          <div className="health-advice-grid">
            <label className="health-advice-field"><span className="eyebrow">{data.meta.doctorAdviceLabel}</span><textarea value={doctorAdvice} onChange={(event) => setDoctorAdvice(event.target.value)} placeholder={data.meta.doctorAdvicePlaceholder} rows={4} /></label>
            <label className="health-advice-field"><span className="eyebrow">{data.meta.aiAdviceLabel}</span><textarea value={aiAdvice} onChange={(event) => setAiAdvice(event.target.value)} placeholder={data.meta.aiAdvicePlaceholder} rows={4} /></label>
          </div>

          {formError && <p className="health-form-error" role="alert">{formError}</p>}
          <button className="button button-primary health-save-button" type="submit"><Check size={16} />{data.meta.saveLabel}</button>
        </form>

        <section className="panel health-history-panel">
          <div className="section-heading"><div><p className="eyebrow">{data.meta.recordsEyebrow}</p><h2>{data.meta.recordsTitle}</h2></div><span className="section-aside">{records.length}</span></div>
          {records.length ? (
            <div className="health-record-list">
              {records.slice(0, 5).map((record) => (
                <article className="health-record" key={record.id}>
                  <div className="health-record-top"><strong>{record.label}</strong><span>{record.categoryIds.length} {data.meta.categoriesUnit}</span></div>
                  <p className="health-record-categories">{getCategoryNames(record.categoryIds)}</p>
                  <div className="health-advice-preview">
                    <div><span>{data.meta.doctorAdviceLabel}</span><p>{record.doctorAdvice || data.meta.noAdvice}</p></div>
                    <div><span>{data.meta.aiAdviceLabel}</span><p>{record.aiAdvice || data.meta.noAdvice}</p></div>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="health-empty-note">{data.meta.noRecords}</p>}
        </section>
      </div>

      {renderTrendSection(records, false)}
      </>}
    </div>
  )
}

type GrowthChartRange = 'daily' | 'weekly' | 'monthly'

function getGrowthChartData(events: GrowthEvent[], range: GrowthChartRange) {
  const grouped = new Map<string, number>()
  for (const event of events) {
    const eventDate = new Date(`${event.date}T00:00:00`)
    let key = event.date
    if (range === 'weekly') {
      const monday = new Date(eventDate)
      const day = monday.getDay() || 7
      monday.setDate(monday.getDate() - day + 1)
      key = formatDateInput(monday)
    } else if (range === 'monthly') {
      key = event.date.slice(0, 7)
    }
    grouped.set(key, (grouped.get(key) ?? 0) + event.points)
  }

  let cumulative = 0
  return [...grouped.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, points]) => {
      cumulative += points
      return { label: range === 'monthly' ? key : key.slice(5), points, cumulative }
    })
}

function formatGrowthScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function GrowthPage({ data, ui, dimensions, events, onAddEvent }: { data: GrowthData; ui: UiData['growth']; dimensions: GrowthDimension[]; events: GrowthEvent[]; onAddEvent: (event: GrowthEvent) => void }) {
  const [chartRange, setChartRange] = useState<GrowthChartRange>('daily')
  const [expandedEventTypes, setExpandedEventTypes] = useState<string[]>(data.eventTypes.slice(0, 1))
  const [eventPages, setEventPages] = useState<Record<string, number>>({})
  const [eventDate, setEventDate] = useState(formatDateInput(new Date()))
  const [eventType, setEventType] = useState(data.eventTypes[0] ?? '')
  const [eventDimensionId, setEventDimensionId] = useState(dimensions[0]?.id ?? '')
  const [eventTitle, setEventTitle] = useState('')
  const [eventPoints, setEventPoints] = useState('1')
  const [eventNote, setEventNote] = useState('')
  const averageScore = dimensions.length ? dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length : 0
  const radarData = dimensions.map((dimension) => ({ dimension: dimension.label, short: dimension.short, score: dimension.score, fullMark: data.maxScore }))
  const chartData = getGrowthChartData(events, chartRange)
  const eventTypes = [...new Set([...data.eventTypes, ...events.map((event) => event.type)])]
  const eventsPerPage = 4

  function toggleEventType(type: string) {
    setExpandedEventTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const points = Number(eventPoints)
    if (!eventTitle.trim() || !eventDimensionId || !Number.isFinite(points)) return
    onAddEvent({ id: `growth-${Date.now()}`, date: eventDate, type: eventType, dimensionId: eventDimensionId, title: eventTitle.trim(), points, note: eventNote.trim() })
    setEventTitle('')
    setEventPoints('1')
    setEventNote('')
  }

  return (
    <div className="page page-growth">
      <section className="page-heading"><div><p className="eyebrow">{data.meta.eyebrow}</p><h1>{data.meta.title}</h1><p className="lede">{data.meta.subtitle}</p></div><div className="growth-average"><span>{ui.averageScoreLabel}</span><strong>{formatGrowthScore(averageScore)}<small>{ui.scoreUnit}</small></strong><em>{ui.normalScoreLabel} {data.normalScore} · {ui.maxScoreLabel} {data.maxScore}</em></div></section>

      <div className="growth-top-grid">
        <section className="panel radar-panel">
          <div className="section-heading"><div><p className="eyebrow">{ui.radarEyebrow}</p><h2>{ui.radarTitle}</h2></div><Compass size={22} className="section-icon" /></div>
          <div className="radar-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}><PolarGrid stroke="#d9d7cf" /><PolarAngleAxis dataKey="short" tick={{ fill: '#6e746e', fontSize: 12, fontWeight: 600 }} /><PolarRadiusAxis domain={[0, data.maxScore]} tick={false} axisLine={false} /><Radar name={ui.radarSeriesLabel} dataKey="score" stroke="#e65f40" fill="#e65f40" fillOpacity={0.22} strokeWidth={2} /><Tooltip /></RadarChart></ResponsiveContainer></div>
          <p className="chart-caption">{ui.radarCaption}</p>
        </section>

        <section className="panel growth-event-form-panel">
          <div className="section-heading"><div><p className="eyebrow">{ui.eventEyebrow}</p><h2>{ui.eventTitle}</h2></div><span className="section-aside">{ui.eventHint}</span></div>
          <form className="growth-event-form" onSubmit={submitEvent}>
            <label><span>{ui.eventDateLabel}</span><input type="date" value={eventDate} onChange={(input) => setEventDate(input.target.value)} required /></label>
            <label><span>{ui.eventTypeLabel}</span><select value={eventType} onChange={(input) => setEventType(input.target.value)}>{data.eventTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>{ui.eventDimensionLabel}</span><select value={eventDimensionId} onChange={(input) => setEventDimensionId(input.target.value)}>{dimensions.map((dimension) => <option key={dimension.id} value={dimension.id}>{dimension.label}</option>)}</select></label>
            <label><span>{ui.eventPointsLabel}</span><input type="number" inputMode="decimal" step="0.1" value={eventPoints} onChange={(input) => setEventPoints(input.target.value)} required /></label>
            <label className="growth-event-title-field"><span>{ui.eventNameLabel}</span><input value={eventTitle} onChange={(input) => setEventTitle(input.target.value)} placeholder={ui.eventNamePlaceholder} required /></label>
            <label className="growth-event-note-field"><span>{ui.eventNoteLabel}</span><input value={eventNote} onChange={(input) => setEventNote(input.target.value)} placeholder={ui.eventNotePlaceholder} /></label>
            <button className="button button-primary" type="submit"><Plus size={16} />{ui.addEventLabel}</button>
          </form>
        </section>
      </div>

      <section className="dimension-section">
        <div className="section-heading"><div><p className="eyebrow">{ui.dimensionsEyebrow}</p><h2>{ui.dimensionsTitle}</h2></div><span className="section-aside">{ui.dimensionsAside}</span></div>
        <div className="dimension-grid">
          {dimensions.map((dimension) => (
            <article className="dimension-card" key={dimension.id}>
              <div className="dimension-top"><span className={`dimension-icon tone-${dimension.tone}`}><MetricIcon name={dimension.icon} size={18} /></span><span className="dimension-score">{formatGrowthScore(dimension.score)}<small>{ui.scoreUnit}</small></span></div>
              <h3>{dimension.label}</h3>
              <p>{dimension.note}</p>
              <div className="dimension-progress"><span style={{ width: `${Math.min(Math.max(dimension.score / data.maxScore * 100, 0), 100)}%` }} /></div>
              <div className="dimension-foot"><span>{ui.normalScoreLabel} {data.normalScore}</span><span>{dimension.score > data.maxScore ? ui.breakthroughLabel : ''}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="growth-chart-section panel">
        <div className="section-heading"><div><p className="eyebrow">{ui.chartEyebrow}</p><h2>{ui.chartTitle}</h2></div><div className="growth-range-tabs">{(['daily', 'weekly', 'monthly'] as GrowthChartRange[]).map((range) => <button className={chartRange === range ? 'is-active' : ''} type="button" key={range} onClick={() => setChartRange(range)}>{ui[`${range}Label`]}</button>)}</div></div>
        {chartData.length ? <div className="growth-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="#e5e3da" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#7b837d', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: '#7b837d', fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip /><Line type="monotone" dataKey="cumulative" name={ui.cumulativePointsLabel} stroke="#e86647" strokeWidth={2.5} dot={{ fill: '#e86647', r: 3 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <div className="growth-chart-empty">{ui.noChartData}</div>}
      </section>

      <section className="growth-events-section">
        <div className="section-heading"><div><p className="eyebrow">{ui.eventsEyebrow}</p><h2>{ui.eventsTitle}</h2></div><span className="section-aside">{events.length} {ui.pointsUnit}</span></div>
        <div className="growth-event-groups">
          {eventTypes.map((type) => {
            const typeEvents = events.filter((event) => event.type === type).sort((first, second) => second.date.localeCompare(first.date))
            const pageCount = Math.max(Math.ceil(typeEvents.length / eventsPerPage), 1)
            const page = Math.min(eventPages[type] ?? 0, pageCount - 1)
            const visibleEvents = typeEvents.slice(page * eventsPerPage, (page + 1) * eventsPerPage)
            return <details className="growth-event-group" key={type} open={expandedEventTypes.includes(type)}><summary onClick={(click) => { click.preventDefault(); toggleEventType(type) }}><span>{type}</span><strong>{typeEvents.length}</strong><ChevronDown size={16} /></summary>{typeEvents.length ? <><div className="growth-event-list">{visibleEvents.map((event) => <article className="growth-event-row" key={event.id}><time>{event.date}</time><div><strong>{event.title}</strong><small>{dimensions.find((dimension) => dimension.id === event.dimensionId)?.label ?? event.dimensionId}{event.note ? ` · ${event.note}` : ''}</small></div><em>+{formatGrowthScore(event.points)}</em></article>)}</div>{pageCount > 1 && <div className="growth-event-pagination"><button type="button" aria-label={ui.previousPageLabel} title={ui.previousPageLabel} disabled={page === 0} onClick={() => setEventPages((current) => ({ ...current, [type]: page - 1 }))}><ChevronLeft size={15} /></button><span>{page + 1} / {pageCount}</span><button type="button" aria-label={ui.nextPageLabel} title={ui.nextPageLabel} disabled={page === pageCount - 1} onClick={() => setEventPages((current) => ({ ...current, [type]: page + 1 }))}><ChevronRight size={15} /></button></div>}</> : <p className="growth-no-events">{ui.noEvents}</p>}</details>
          })}
        </div>
      </section>

      <section className="signal-section">
        <div className="section-heading"><div><p className="eyebrow">{ui.signalEyebrow}</p><h2>{data.meta.signalTitle}</h2></div></div>
        <div className="signal-grid">
          {data.signals.map((signal) => (
            <article className={`signal-card tone-panel-${signal.tone}`} key={signal.label}><span className="signal-icon"><MetricIcon name={signal.icon} size={18} /></span><div><span>{signal.label}</span><strong>{signal.value}</strong><small>{signal.detail}</small></div></article>
          ))}
        </div>
      </section>
    </div>
  )
}

function RitualsPage({ data, ui, checklists, onToggleItem, onAddChecklist, onResetPage }: { data: RitualsData; ui: UiData['rituals']; checklists: Checklist[]; onToggleItem: (checklistId: string, itemId: string) => void; onAddChecklist: (title: string, firstAction: string) => string; onResetPage: () => void }) {
  const [activeChecklistId, setActiveChecklistId] = useState(checklists[0]?.id ?? '')
  const [isCreating, setIsCreating] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [newChecklistAction, setNewChecklistAction] = useState('')
  const activeChecklist = checklists.find((checklist) => checklist.id === activeChecklistId) ?? checklists[0]

  if (!activeChecklist) return null

  const completed = activeChecklist.items.filter((item) => item.done).length
  const progress = activeChecklist.items.length ? Math.round((completed / activeChecklist.items.length) * 100) : 0

  function submitNewChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newChecklistTitle.trim()
    const firstAction = newChecklistAction.trim()
    if (!title || !firstAction) return
    setActiveChecklistId(onAddChecklist(title, firstAction))
    setNewChecklistTitle('')
    setNewChecklistAction('')
    setIsCreating(false)
  }

  return (
    <div className="page page-rituals">
      <section className="page-heading"><div><p className="eyebrow">{data.meta.eyebrow}</p><h1>{data.meta.title}</h1><p className="lede">{data.meta.subtitle}</p></div><button className="button button-dark" type="button" aria-expanded={isCreating} onClick={() => setIsCreating((current) => !current)}><Plus size={16} /> {ui.newChecklistLabel}</button></section>
      {isCreating && (
        <form className="new-checklist-form" onSubmit={submitNewChecklist}>
          <div className="new-checklist-fields">
            <input autoFocus value={newChecklistTitle} onChange={(event) => setNewChecklistTitle(event.target.value)} placeholder={ui.newChecklistTitlePlaceholder} aria-label={ui.newChecklistTitlePlaceholder} required />
            <input value={newChecklistAction} onChange={(event) => setNewChecklistAction(event.target.value)} placeholder={ui.newChecklistActionPlaceholder} aria-label={ui.newChecklistActionPlaceholder} required />
          </div>
          <div className="new-checklist-actions">
            <button className="button button-dark" type="submit">{ui.createChecklistLabel}</button>
            <button className="text-button" type="button" onClick={() => setIsCreating(false)}>{ui.cancelChecklistLabel}</button>
          </div>
        </form>
      )}

      <div className="ritual-layout">
        <aside className="checklist-index panel">
          <div className="index-heading"><span className="eyebrow">{data.meta.listLabel}</span><span>{String(checklists.length).padStart(2, '0')}</span></div>
          <div className="checklist-list">
            {checklists.map((checklist) => {
              const listCompleted = checklist.items.filter((item) => item.done).length
              return <button className={`checklist-nav ${checklist.id === activeChecklist.id ? 'is-active' : ''}`} type="button" key={checklist.id} onClick={() => setActiveChecklistId(checklist.id)}><span className={`checklist-nav-icon tone-${checklist.tone}`}><MetricIcon name={checklist.icon} size={17} /></span><span><strong>{checklist.title}</strong><small>{checklist.category}</small></span><em>{listCompleted}/{checklist.items.length}</em></button>
            })}
          </div>
          <div className="index-footer"><span>{ui.todayCompletedLabel}</span><strong>{checklists.reduce((total, list) => total + list.items.filter((item) => item.done).length, 0)} {ui.actionUnit}</strong></div>
        </aside>

        <section className="checklist-detail panel-paper">
          <div className="detail-top"><div className={`detail-icon tone-${activeChecklist.tone}`}><MetricIcon name={activeChecklist.icon} size={23} /></div><div><p className="eyebrow">{data.meta.selectedLabel}</p><h2>{activeChecklist.title}</h2><p>{activeChecklist.subtitle}</p></div><button className="icon-button" type="button" aria-label={data.meta.resetLabel} title={data.meta.resetLabel} onClick={onResetPage}><RotateCcw size={17} /></button></div>
          <div className="detail-progress-row"><div><strong>{completed} / {activeChecklist.items.length}</strong><span>{data.meta.doneLabel}</span></div><div><strong>{activeChecklist.duration}</strong><span>{activeChecklist.category}</span></div><span className="detail-progress-value">{progress}%</span></div>
          <div className="detail-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="action-list">
            {activeChecklist.items.map((item, index) => (
              <button className={`action-row ${item.done ? 'is-done' : ''}`} type="button" key={item.id} onClick={() => onToggleItem(activeChecklist.id, item.id)}><span className="action-number">{String(index + 1).padStart(2, '0')}</span><span className="action-check">{item.done && <Check size={15} />}</span><span className="action-copy"><strong>{item.label}</strong><small>{item.hint}</small></span><ChevronRight className="action-arrow" size={17} /></button>
            ))}
          </div>
          <div className="detail-footer"><span><Sparkles size={15} /> {data.meta.completeCopy}</span><button className="text-button" type="button">{data.meta.startLabel} <ArrowUpRight size={15} /></button></div>
        </section>
      </div>
    </div>
  )
}

export default App

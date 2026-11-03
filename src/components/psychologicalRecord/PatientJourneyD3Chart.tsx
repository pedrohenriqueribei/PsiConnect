import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  PsychologicalRecord,
  EvolutionSession,
  ClinicalMilestone,
  EVOLUTION_SCALE_MAP,
  RECORD_STATUS_LABELS,
} from '../../types/psychologicalRecord';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  Target,
  Clock,
  Shield,
  Activity,
  ChevronRight,
  Filter,
  Plus,
  Compass,
  ArrowUpRight,
  Info,
  Check,
  Flag,
  FileText,
  User,
  HeartHandshake,
  AlertTriangle,
} from 'lucide-react';

interface PatientJourneyD3ChartProps {
  record: PsychologicalRecord;
  allRecords?: PsychologicalRecord[];
  onSelectPatient?: (patientId: string) => void;
  onAddMilestone?: (milestone: ClinicalMilestone) => void;
  onOpenSessionModal?: () => void;
}

const MILESTONE_CATEGORIES: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  alliance: {
    label: 'Vínculo & TCLE',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: '🤝',
  },
  symptom_reduction: {
    label: 'Alívio de Sintomas',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '🌿',
  },
  insight: {
    label: 'Insight & Psicoeducação',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '💡',
  },
  behavioral: {
    label: 'Mudança Comportamental',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '⚡',
  },
  autonomy: {
    label: 'Autonomia & Resiliência',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: '🧭',
  },
  discharge: {
    label: 'Alta Clínica / Conclusão',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: '🏆',
  },
};

export const PatientJourneyD3Chart: React.FC<PatientJourneyD3ChartProps> = ({
  record,
  allRecords = [],
  onSelectPatient,
  onAddMilestone,
  onOpenSessionModal,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter & Display toggles
  const [filterMode, setFilterMode] = useState<'all' | 'milestones_only' | 'recent_5'>('all');
  const [showMilestoneLabels, setShowMilestoneLabels] = useState(true);
  const [showAreaGradient, setShowAreaGradient] = useState(true);

  // Hover state for interactive tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{
    session: EvolutionSession;
    x: number;
    y: number;
    milestone?: ClinicalMilestone;
  } | null>(null);

  // Selected session for detailed drawer / card below
  const [selectedSession, setSelectedSession] = useState<EvolutionSession | null>(null);

  // New milestone modal / form state
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneCat, setNewMilestoneCat] = useState<ClinicalMilestone['category']>('insight');
  const [newMilestoneSession, setNewMilestoneSession] = useState<number>(1);

  // Sort sessions chronologically
  const chronologicalSessions = useMemo(() => {
    return [...(record.sessions || [])].sort((a, b) => a.sessionNumber - b.sessionNumber);
  }, [record.sessions]);

  // Combined milestones (from record.milestones and from individual session.milestoneAchieved)
  const combinedMilestones: ClinicalMilestone[] = useMemo(() => {
    const list: ClinicalMilestone[] = [...(record.milestones || [])];

    chronologicalSessions.forEach(s => {
      if (s.milestoneAchieved) {
        const existing = list.find(m => m.sessionNumber === s.sessionNumber);
        if (!existing) {
          list.push({
            id: `ms_sess_${s.id}`,
            title: s.milestoneAchieved,
            description: s.evolutionNotes || `Marco clínico atingido na Sessão #${s.sessionNumber}`,
            sessionNumber: s.sessionNumber,
            date: s.date,
            category: s.milestoneCategory || 'behavioral',
            achieved: true,
          });
        }
      }
    });

    return list.sort((a, b) => {
      const sessA = a.sessionNumber ?? 0;
      const sessB = b.sessionNumber ?? 0;
      return sessA - sessB;
    });
  }, [record.milestones, chronologicalSessions]);

  // Filtered session list for chart display
  const chartSessions = useMemo(() => {
    if (filterMode === 'recent_5') {
      return chronologicalSessions.slice(-5);
    }
    if (filterMode === 'milestones_only') {
      const milestoneSessionNumbers = new Set(
        combinedMilestones.map(m => m.sessionNumber).filter(Boolean)
      );
      const filtered = chronologicalSessions.filter(
        s => milestoneSessionNumbers.has(s.sessionNumber) || s.milestoneAchieved
      );
      return filtered.length > 0 ? filtered : chronologicalSessions;
    }
    return chronologicalSessions;
  }, [chronologicalSessions, filterMode, combinedMilestones]);

  // Overall trajectory calculations
  const totalSessions = chronologicalSessions.length;
  const initialSession = chronologicalSessions[0];
  const latestSession = chronologicalSessions[totalSessions - 1];
  const initialScore = initialSession ? initialSession.evolutionScore : 1;
  const latestScore = latestSession ? latestSession.evolutionScore : 1;
  const deltaScore = latestScore - initialScore;

  // Days in therapy
  const startDate = record.initialDemand?.treatmentStartDate || record.createdAt?.split('T')[0];
  const daysInTherapy = useMemo(() => {
    if (!startDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date().getTime();
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [startDate]);

  // Goals completion rate (estimated from goals in therapeutic plan and milestones)
  const goalsTotal = record.therapeuticPlan?.goals?.length || 4;
  const achievedMilestonesCount = combinedMilestones.filter(m => m.achieved).length;
  const progressPercent = Math.min(100, Math.round((achievedMilestonesCount / Math.max(goalsTotal, 1)) * 100));

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || chartSessions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    // Dimensions
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const width = 820;
    const height = 340;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Main group
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients Definition
    const defs = svg.append('defs');

    // Area Gradient: Emerald to transparent
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'journey-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    areaGradient.append('stop').attr('offset', '60%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.12);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.0);

    // Line Gradient: Sky to Emerald
    const lineGradient = defs
      .append('linearGradient')
      .attr('id', 'journey-line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#0284c7');
    lineGradient.append('stop').attr('offset', '50%').attr('stop-color', '#0d9488');
    lineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

    // Soft drop shadow filter for nodes
    const filter = defs
      .append('filter')
      .attr('id', 'journey-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feDropShadow').attr('dx', '0').attr('dy', '2').attr('stdDeviation', '3').attr('flood-opacity', '0.15');

    // Scales
    // X Scale: Point scale along sessions
    const xScale = d3
      .scalePoint<string>()
      .domain(chartSessions.map(s => `S${s.sessionNumber}`))
      .range([0, innerWidth])
      .padding(chartSessions.length === 1 ? 0.5 : 0.08);

    // Y Scale: Linear from 1 to 5 (Scores)
    const yScale = d3.scaleLinear().domain([1, 5]).range([innerHeight, 0]);

    // Background Clinical Bands (Zones: Melhora, Estável, Atenção)
    // Zone 1: Melhora (Scores 3.5 to 5)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(5))
      .attr('width', innerWidth)
      .attr('height', yScale(3.5) - yScale(5))
      .attr('fill', '#ecfdf5')
      .attr('opacity', 0.6)
      .attr('rx', 4);

    // Zone 2: Estabilidade (Scores 2.5 to 3.5)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(3.5))
      .attr('width', innerWidth)
      .attr('height', yScale(2.5) - yScale(3.5))
      .attr('fill', '#f0f9ff')
      .attr('opacity', 0.5);

    // Zone 3: Atenção / Vulnerabilidade (Scores 1 to 2.5)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(2.5))
      .attr('width', innerWidth)
      .attr('height', yScale(1) - yScale(2.5))
      .attr('fill', '#fff1f2')
      .attr('opacity', 0.35)
      .attr('rx', 4);

    // Horizontal Grid Lines & Score Labels
    const yTicks = [1, 2, 3, 4, 5];
    yTicks.forEach(tick => {
      const yPos = yScale(tick);

      // Grid line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yPos)
        .attr('y2', yPos)
        .attr('stroke', tick === 3 ? '#94a3b8' : '#e2e8f0')
        .attr('stroke-dasharray', tick === 3 ? '4,4' : '2,2')
        .attr('stroke-width', tick === 3 ? 1.5 : 1);

      // Score description label on right
      const scaleInfo = EVOLUTION_SCALE_MAP[tick];
      g.append('text')
        .attr('x', innerWidth + 10)
        .attr('y', yPos + 3)
        .attr('fill', tick >= 4 ? '#059669' : tick === 3 ? '#64748b' : '#e11d48')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text(`${tick} · ${scaleInfo ? scaleInfo.trend.toUpperCase() : ''}`);
    });

    // Baseline indicator label
    g.append('text')
      .attr('x', 8)
      .attr('y', yScale(3) - 6)
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.5px')
      .text('LINHA DE BASE (ESTABILIDADE CLÍNICA)');

    // Line Generator with smooth MonotoneX interpolation
    const lineGenerator = d3
      .line<EvolutionSession>()
      .x(d => xScale(`S${d.sessionNumber}`) || 0)
      .y(d => yScale(d.evolutionScore))
      .curve(chartSessions.length > 2 ? d3.curveMonotoneX : d3.curveLinear);

    // Area Generator
    const areaGenerator = d3
      .area<EvolutionSession>()
      .x(d => xScale(`S${d.sessionNumber}`) || 0)
      .y0(innerHeight)
      .y1(d => yScale(d.evolutionScore))
      .curve(chartSessions.length > 2 ? d3.curveMonotoneX : d3.curveLinear);

    // Render Area
    if (showAreaGradient && chartSessions.length > 1) {
      g.append('path')
        .datum(chartSessions)
        .attr('class', 'journey-area')
        .attr('d', areaGenerator)
        .attr('fill', 'url(#journey-area-gradient)');
    }

    // Render Main Curve Line
    if (chartSessions.length > 1) {
      const path = g
        .append('path')
        .datum(chartSessions)
        .attr('class', 'journey-line')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', 'url(#journey-line-gradient)')
        .attr('stroke-width', 3.5)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

      // Subtle animation for path reveal
      const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Interactive Vertical Crosshair Line (hidden by default)
    const crosshair = g
      .append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0284c7')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    // Render Milestone Pins & Session Nodes
    chartSessions.forEach(session => {
      const cx = xScale(`S${session.sessionNumber}`) || 0;
      const cy = yScale(session.evolutionScore);

      // Check if session has milestone attached
      const milestone = combinedMilestones.find(
        m => m.sessionNumber === session.sessionNumber || m.date === session.date
      );

      const isMilestone = Boolean(milestone || session.milestoneAchieved);

      // Vertical connecting stem from node to top flag (if milestone)
      if (isMilestone) {
        g.append('line')
          .attr('x1', cx)
          .attr('x2', cx)
          .attr('y1', cy)
          .attr('y2', cy - 24)
          .attr('stroke', '#0d9488')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2');

        // Milestone Flag / Diamond badge at top
        const flagGroup = g
          .append('g')
          .attr('transform', `translate(${cx}, ${cy - 28})`)
          .style('cursor', 'pointer')
          .on('click', () => {
            setSelectedSession(session);
          });

        // Glowing outer halo
        flagGroup
          .append('circle')
          .attr('r', 11)
          .attr('fill', '#ecfdf5')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 1.5);

        // Milestone icon / star
        flagGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '11px')
          .text('★');

        // Text label pill above milestone if enabled
        if (showMilestoneLabels && milestone) {
          const title = milestone.title.length > 22 ? `${milestone.title.slice(0, 20)}…` : milestone.title;
          flagGroup
            .append('rect')
            .attr('x', -40)
            .attr('y', -24)
            .attr('width', 80)
            .attr('height', 16)
            .attr('rx', 4)
            .attr('fill', '#047857')
            .attr('opacity', 0.95);

          flagGroup
            .append('text')
            .attr('x', 0)
            .attr('y', -13)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .text(title);
        }
      }

      // Outer interactive pulse ring
      const nodeGroup = g
        .append('g')
        .attr('class', `node-sess-${session.sessionNumber}`)
        .attr('transform', `translate(${cx}, ${cy})`)
        .style('cursor', 'pointer');

      // Pulse background ring
      nodeGroup
        .append('circle')
        .attr('r', isMilestone ? 9 : 7)
        .attr('fill', isMilestone ? '#10b981' : session.evolutionScore >= 4 ? '#0ea5e9' : '#64748b')
        .attr('opacity', 0.2)
        .attr('class', 'pulse-ring');

      // Main inner circle
      const mainCircle = nodeGroup
        .append('circle')
        .attr('r', isMilestone ? 6.5 : 5)
        .attr('fill', isMilestone ? '#059669' : session.evolutionScore >= 4 ? '#0284c7' : '#475569')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#journey-shadow)');

      // Risk Warning badge icon on point if risk detected
      if (session.risks?.hasActiveRisk) {
        nodeGroup
          .append('circle')
          .attr('cx', 6)
          .attr('cy', -6)
          .attr('r', 4.5)
          .attr('fill', '#e11d48')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1);
      }

      // Hit area overlay for smooth interaction
      const hitArea = nodeGroup
        .append('circle')
        .attr('r', 22)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer');

      hitArea
        .on('mouseenter', () => {
          mainCircle.transition().duration(150).attr('r', 8.5);
          crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 1);

          setHoveredPoint({
            session,
            x: cx + margin.left,
            y: cy + margin.top,
            milestone,
          });
        })
        .on('mouseleave', () => {
          mainCircle.transition().duration(150).attr('r', isMilestone ? 6.5 : 5);
          crosshair.style('opacity', 0);
          setHoveredPoint(null);
        })
        .on('click', () => {
          setSelectedSession(session);
        });
    });

    // X Axis with Session Labels & Dates
    chartSessions.forEach(session => {
      const cx = xScale(`S${session.sessionNumber}`) || 0;

      // Session number label
      g.append('text')
        .attr('x', cx)
        .attr('y', innerHeight + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#0f172a')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(`Sessão ${session.sessionNumber}`);

      // Session date
      g.append('text')
        .attr('x', cx)
        .attr('y', innerHeight + 32)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .text(session.date.split('-').slice(1).reverse().join('/'));
    });

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.5px')
      .text('ESCALA DE EVOLUÇÃO (1 A 5)');
  }, [chartSessions, showAreaGradient, showMilestoneLabels, combinedMilestones]);

  // Handle adding milestone
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newMilestone: ClinicalMilestone = {
      id: `ms_${Date.now()}`,
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim() || 'Marco terapêutico alcançado.',
      sessionNumber: Number(newMilestoneSession) || undefined,
      date: new Date().toISOString().split('T')[0],
      category: newMilestoneCat,
      achieved: true,
    };

    if (onAddMilestone) {
      onAddMilestone(newMilestone);
    }

    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setIsAddingMilestone(false);
  };

  return (
    <div className="space-y-6">
      {/* Patient Header & Quick Switcher Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
              <Compass className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Jornada Clínica: {record.identification.fullName}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    RECORD_STATUS_LABELS[record.status]?.bg || 'bg-slate-50'
                  } ${RECORD_STATUS_LABELS[record.status]?.color || 'text-slate-700'} ${
                    RECORD_STATUS_LABELS[record.status]?.border || 'border-slate-200'
                  }`}
                >
                  {RECORD_STATUS_LABELS[record.status]?.label || record.status}
                </span>
                {record.isMinor && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                    Menor de Idade
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                <strong>Hipótese Diagnóstica:</strong>{' '}
                {record.initialAssessment?.diagnosticHypothesis || 'Em investigação clínica'} ·{' '}
                <strong>Abordagem:</strong>{' '}
                {record.initialAssessment?.theoreticalApproach || 'TCC Integrada'} ·{' '}
                <strong>Início:</strong> {startDate} ({daysInTherapy} dias de jornada)
              </p>
            </div>
          </div>

          {/* Patient Selector (if multiple records provided) */}
          {allRecords.length > 0 && onSelectPatient && (
            <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-50 p-2 rounded-xl border border-slate-200">
              <User className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                Alternar Paciente:
              </label>
              <select
                value={record.patientId}
                onChange={e => onSelectPatient(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 max-w-xs"
              >
                {allRecords.map(r => (
                  <option key={r.id} value={r.patientId}>
                    {r.identification.fullName} ({r.sessions?.length || 0} sessões)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4 Interactive Journey KPI Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/80">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
              <span>Status Atual na Escala</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-950 tabular-nums">
                {latestScore}
                <span className="text-xs font-normal text-slate-500"> / 5.0</span>
              </span>
              <span className="text-xs font-bold text-emerald-700">
                {EVOLUTION_SCALE_MAP[latestScore]?.trend.toUpperCase()}
              </span>
            </div>
            <span className="text-[11px] text-emerald-800/80 block mt-1 truncate">
              {EVOLUTION_SCALE_MAP[latestScore]?.label}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50/80 to-indigo-50/40 border border-sky-200/80">
            <div className="flex items-center justify-between text-sky-800 text-xs font-semibold mb-1">
              <span>Progressão Longitudinal</span>
              <TrendingUp className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  deltaScore > 0 ? 'text-emerald-700' : deltaScore < 0 ? 'text-rose-700' : 'text-slate-800'
                }`}
              >
                {deltaScore > 0 ? `+${deltaScore}` : deltaScore} pts
              </span>
              <span className="text-xs font-medium text-slate-500">
                de {initialScore} p/ {latestScore}
              </span>
            </div>
            <span className="text-[11px] text-sky-800/80 block mt-1">
              {deltaScore > 0
                ? 'Curva ascendente favorável'
                : deltaScore === 0
                ? 'Estabilidade clínica mantida'
                : 'Atenção a oscilações recentes'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-200/80">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
              <span>Marcos Conquistados</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-950 tabular-nums">
                {achievedMilestonesCount}
              </span>
              <span className="text-xs font-bold text-amber-700">
                ({progressPercent}% dos objetivos)
              </span>
            </div>
            <span className="text-[11px] text-amber-800/80 block mt-1">
              {goalsTotal} objetivos no plano terapêutico
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/80 to-pink-50/40 border border-purple-200/80">
            <div className="flex items-center justify-between text-purple-800 text-xs font-semibold mb-1">
              <span>Sessões & Adesão</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-950 tabular-nums">
                {totalSessions}
              </span>
              <span className="text-xs font-medium text-slate-500">sessões registradas</span>
            </div>
            <span className="text-[11px] text-purple-800/80 block mt-1">
              Frequência {record.therapeuticPlan?.sessionFrequency || 'semanal'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive D3 Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              Trajetória Clínica Interativa (Visualização D3)
            </h3>
            <p className="text-xs text-slate-500">
              Passe o mouse pelos pontos para inspecionar técnicas, estado emocional e marcos terapêuticos.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({totalSessions})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('milestones_only')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterMode === 'milestones_only'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apenas Marcos ({achievedMilestonesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('recent_5')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterMode === 'recent_5'
                    ? 'bg-white text-sky-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Últimas 5
              </button>
            </div>

            {/* Toggle labels */}
            <button
              type="button"
              onClick={() => setShowMilestoneLabels(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                showMilestoneLabels
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Rótulos de Marcos: {showMilestoneLabels ? 'Visíveis' : 'Ocultos'}
            </button>

            {/* Add Milestone Quick Button */}
            <button
              type="button"
              onClick={() => setIsAddingMilestone(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Marco</span>
            </button>
          </div>
        </div>

        {/* Legend strip */}
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Legenda Clínica:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <strong className="text-slate-800">Score 4-5:</strong> Melhora / Autonomia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
            <strong className="text-slate-800">Score 3:</strong> Estabilidade Clínica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <strong className="text-slate-800">Score 1-2:</strong> Sintomas Agudos / Piora
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 text-[10px] flex items-center justify-center font-bold">
              ★
            </span>
            <strong className="text-emerald-900">Marco Conquistado</strong>
          </span>
        </div>

        {/* Chart Container with D3 SVG */}
        <div ref={containerRef} className="relative w-full overflow-x-auto">
          {chartSessions.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhuma sessão registrada para este paciente</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                À medida que as evoluções clínicas forem registradas, o gráfico D3 desenhará a jornada automaticamente.
              </p>
            </div>
          ) : (
            <div className="min-w-[720px]">
              <svg ref={svgRef} className="w-full h-auto drop-shadow-2xs" />
            </div>
          )}

          {/* Floating Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-30 pointer-events-none transition-all duration-100 p-4 bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-700 text-xs w-72 backdrop-blur-sm"
              style={{
                left: Math.min(hoveredPoint.x + 12, 540),
                top: Math.max(hoveredPoint.y - 120, 10),
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                <span className="font-bold text-sky-400 text-sm">
                  Sessão #{hoveredPoint.session.sessionNumber}
                </span>
                <span className="text-[11px] text-slate-300 tabular-nums">
                  {hoveredPoint.session.date}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Score de Evolução:</span>
                  <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {hoveredPoint.session.evolutionScore} / 5 ·{' '}
                    {EVOLUTION_SCALE_MAP[hoveredPoint.session.evolutionScore]?.label.split('-')[1]}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Estado Emocional:
                  </span>
                  <span className="text-slate-200 line-clamp-2">
                    {hoveredPoint.session.emotionalState}
                  </span>
                </div>

                {hoveredPoint.session.interventions && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Técnica / Intervenção:
                    </span>
                    <span className="text-slate-200 line-clamp-2">
                      {hoveredPoint.session.interventions}
                    </span>
                  </div>
                )}

                {hoveredPoint.milestone && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/40 bg-emerald-950/40 p-2 rounded-lg">
                    <span className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Marco: {hoveredPoint.milestone.title}
                    </span>
                    <p className="text-[10px] text-emerald-200 mt-0.5">
                      {hoveredPoint.milestone.description}
                    </p>
                  </div>
                )}

                {hoveredPoint.session.risks?.hasActiveRisk && (
                  <div className="mt-1 pt-1 border-t border-rose-500/40 flex items-center gap-1.5 text-rose-300 text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Atenção: Risco ou vulnerabilidade apontada</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Session Inspector Card (if a node is clicked) */}
      {selectedSession && (
        <div className="bg-gradient-to-r from-sky-50/70 via-white to-emerald-50/70 rounded-2xl border border-sky-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
                #{selectedSession.sessionNumber}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Detalhes Clínicos da Sessão #{selectedSession.sessionNumber}
                </h4>
                <p className="text-xs text-slate-500">
                  Realizada em {selectedSession.date} ({selectedSession.startTime} às {selectedSession.endTime}) · Modalidade {selectedSession.modality}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1 rounded-lg border border-slate-200 hover:bg-white transition-colors"
            >
              Fechar Detalhes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Estado Emocional & Observações:
              </span>
              <p className="text-slate-800 leading-relaxed font-sans">{selectedSession.emotionalState}</p>
              {selectedSession.evolutionNotes && (
                <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-100 italic">
                  "{selectedSession.evolutionNotes}"
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Intervenções & Técnicas:
              </span>
              <p className="text-slate-800 leading-relaxed font-sans">
                {selectedSession.interventions || 'Intervenções de acolhimento e escuta terapêutica.'}
              </p>
              {selectedSession.nextSessionTasks && (
                <div className="pt-1.5 border-t border-slate-100 text-[11px] text-sky-800">
                  <strong>Tarefa / Prescrição:</strong> {selectedSession.nextSessionTasks}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Classificação na Escala:
              </span>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                <span className="font-bold text-sm">Nota {selectedSession.evolutionScore} / 5</span>
                <span className="text-[11px] font-semibold text-emerald-800">
                  {EVOLUTION_SCALE_MAP[selectedSession.evolutionScore]?.label}
                </span>
              </div>

              {selectedSession.milestoneAchieved && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Marco: {selectedSession.milestoneAchieved}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Milestone Roadmap Cards Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Marcos Clínicos Conquistados na Jornada
            </h3>
            <p className="text-xs text-slate-500">
              Conquistas e objetivos atingidos pelo paciente ao longo do processo terapêutico.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingMilestone(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Marco Terapêutico</span>
          </button>
        </div>

        {/* Milestone Cards Grid */}
        {combinedMilestones.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhum marco registrado ainda</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Clique em "Adicionar Marco Terapêutico" para sinalizar avanços como o controle de crises, remissão de sintomas ou conquista de autonomia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinedMilestones.map((milestone, idx) => {
              const catConfig =
                MILESTONE_CATEGORIES[milestone.category] || MILESTONE_CATEGORIES.insight;
              return (
                <div
                  key={milestone.id || idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                    >
                      <span>{catConfig.icon}</span>
                      <span>{catConfig.label}</span>
                    </span>

                    {milestone.sessionNumber && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Sessão #{milestone.sessionNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {milestone.date}
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Conquistado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Therapeutic Plan Goals Alignment Checklist */}
        {record.therapeuticPlan?.goals && record.therapeuticPlan.goals.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-700" />
              Alinhamento com Objetivos do Plano Terapêutico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {record.therapeuticPlan.goals.map((goal, i) => {
                const isCompleted = i < achievedMilestonesCount;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div>
                      <span className="leading-snug block">{goal}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {isCompleted ? 'Objetivo em fase de consolidação' : 'Objetivo em andamento'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New Milestone Modal */}
      {isAddingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Award className="w-5 h-5 text-amber-600" />
                <span>Registrar Novo Marco Clínico</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingMilestone(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Marco Conquistado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  placeholder="Ex: Primeira apresentação corporativa sem crise de pânico"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria do Marco
                  </label>
                  <select
                    value={newMilestoneCat}
                    onChange={e => setNewMilestoneCat(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {Object.entries(MILESTONE_CATEGORIES).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vincular à Sessão
                  </label>
                  <select
                    value={newMilestoneSession}
                    onChange={e => setNewMilestoneSession(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {chronologicalSessions.map(s => (
                      <option key={s.id} value={s.sessionNumber}>
                        Sessão #{s.sessionNumber} ({s.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição & Evidências Clínicas
                </label>
                <textarea
                  rows={3}
                  value={newMilestoneDesc}
                  onChange={e => setNewMilestoneDesc(e.target.value)}
                  placeholder="Descreva o avanço percebido pelo paciente, técnicas empregadas e impacto na rotina..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
                >
                  Salvar Marco na Jornada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

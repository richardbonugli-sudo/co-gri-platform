import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';

// Unified Framework - Five Modes (Week 6)
import CountryMode from './pages/modes/CountryMode';
import CompanyMode from './pages/modes/CompanyMode';
import ForecastMode from './pages/modes/ForecastMode';
import ScenarioMode from './pages/modes/ScenarioMode';
import TradingMode from './pages/modes/TradingMode';

// Legacy Pages (Phase 1 & 2)
import Index from './pages/Index';
import COGRI from './pages/COGRI';
import EnhancedCOGRI from './pages/EnhancedCOGRI';
import EnhancedCompanyMode from './pages/EnhancedCompanyMode';
import CompanyModePage from './pages/CompanyModePage';
import Portfolio from './pages/Portfolio';
import LowestRisk from './pages/LowestRisk';
import HighestRisk from './pages/HighestRisk';
import About from './pages/About';
import Contact from './pages/Contact';
import ConsultingServices from './pages/ConsultingServices';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Disclaimer from './pages/Disclaimer';
import Gurus from './pages/Gurus';
import DataQuality from './pages/DataQuality';
import SectorMultiplierReference from './pages/SectorMultiplierReference';
import DiagnosticTest from './pages/DiagnosticTest';
import TradingSignalService from './pages/TradingSignalService';
import COGRITradingSignalService from './pages/COGRITradingSignalService';
import DataExpansion from './pages/DataExpansion';
import CSIEventManager from './pages/CSIEventManager';
import CSIEventReview from './pages/CSIEventReview';
import CSIPropagationNetwork from './pages/CSIPropagationNetwork';
import CSIAnalyticsDashboard from './pages/CSIAnalyticsDashboard';
import CSIRefactoredDashboard from './pages/CSIRefactoredDashboard';
import CSIVerificationDashboard from './pages/CSIVerificationDashboard';
import GlobalAuditDashboard from './pages/GlobalAuditDashboard';
import Phase2AddendumDashboard from './pages/Phase2AddendumDashboard';
import VectorMovementForensicAuditDashboard from './pages/VectorMovementForensicAuditDashboard';
import GroundTruthRecallAuditDashboard from './pages/GroundTruthRecallAuditDashboard';
import Phase2_1AddendumDashboard from './pages/Phase2_1AddendumDashboard';
import StrategicForecast from './pages/StrategicForecast';
import CompletenessReport from './pages/CompletenessReport';
import COGRIMethodologyPDF from './pages/COGRIMethodologyPDF';
import CSIMethodologyPDF from './pages/CSIMethodologyPDF';
import Phase2Phase3Dashboard from './pages/Phase2Phase3Dashboard';
import COGRIAnalysis from './pages/phase23/COGRIAnalysis';
import TradingSignals from './pages/phase23/TradingSignals';
import RiskManagement from './pages/phase23/RiskManagement';
import DataSources from './pages/phase23/DataSources';
import Reports from './pages/phase23/Reports';
import Configuration from './pages/phase23/Configuration';
import ScenarioModeLegacy from './pages/ScenarioMode';
import NotFound from './pages/NotFound';
import UnifiedDashboard from './pages/UnifiedDashboard';
import UnifiedDashboardV2 from './pages/UnifiedDashboardV2';
import EventManagementDashboard from './pages/EventManagementDashboard';
import TestRiskVector from './pages/TestRiskVector';
import TestGlobalRisk from './pages/TestGlobalRisk';
import COGRIAuditReport from './pages/COGRIAuditReport';

const App = () => (
  <>
    <Switch>
      {/* ========== TEST ROUTES ========== */}
      <Route path="/test-risk-vector" component={TestRiskVector} />
      <Route path="/test-global-risk" component={TestGlobalRisk} />

      {/* ========== AUDIT REPORT ========== */}
      <Route path="/cogri-audit-report" component={COGRIAuditReport} />

      {/* ========== UNIFIED FRAMEWORK ROUTES (Week 6) ========== */}
      <Route path="/country" component={CountryMode} />
      <Route path="/company" component={CompanyMode} />
      <Route path="/forecast" component={ForecastMode} />
      <Route path="/scenario" component={ScenarioMode} />
      <Route path="/trading" component={TradingMode} />

      {/* ========== NEW DASHBOARD (V2) ========== */}
      <Route path="/dashboard" component={UnifiedDashboardV2} />
      <Route path="/dashboard-v1" component={UnifiedDashboard} />

      {/* ========== LEGACY ROUTES (Phase 1 & 2) ========== */}
      <Route path="/" component={Index} />
      <Route path="/cogri" component={COGRI} />
      <Route path="/enhanced-cogri" component={EnhancedCOGRI} />
      <Route path="/company-mode" component={CompanyModePage} />
      <Route path="/company-mode-legacy" component={EnhancedCompanyMode} />
      <Route path="/scenario-mode" component={ScenarioModeLegacy} />
      <Route path="/unique-approach" component={About} />
      <Route path="/cogri-portfolio" component={Portfolio} />
      <Route path="/cogri-lowest-risk" component={LowestRisk} />
      <Route path="/cogri-highest-risk" component={HighestRisk} />
      <Route path="/contact" component={Contact} />
      <Route path="/consulting-services" component={ConsultingServices} />
      <Route path="/predictive-analytics" component={PredictiveAnalytics} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/gurus" component={Gurus} />
      <Route path="/data-quality" component={DataQuality} />
      <Route path="/sector-multiplier-reference" component={SectorMultiplierReference} />
      <Route path="/diagnostic-test" component={DiagnosticTest} />
      <Route path="/trading-signal-service" component={TradingSignalService} />
      <Route path="/cogri-trading-signal-service" component={COGRITradingSignalService} />
      <Route path="/data-expansion" component={DataExpansion} />
      <Route path="/csi-events" component={CSIEventManager} />
      <Route path="/csi-review" component={CSIEventReview} />
      <Route path="/csi-propagation" component={CSIPropagationNetwork} />
      <Route path="/csi-analytics" component={CSIAnalyticsDashboard} />
      <Route path="/csi-refactored" component={CSIRefactoredDashboard} />
      <Route path="/csi-verification" component={CSIVerificationDashboard} />
      <Route path="/global-audit" component={GlobalAuditDashboard} />
      <Route path="/vector-movement-audit" component={VectorMovementForensicAuditDashboard} />
      <Route path="/ground-truth-recall-audit" component={GroundTruthRecallAuditDashboard} />
      <Route path="/event-management" component={EventManagementDashboard} />
      <Route path="/completeness-report" component={CompletenessReport} />
      <Route path="/phase2-addendum" component={Phase2AddendumDashboard} />
      <Route path="/phase2-1-addendum" component={Phase2_1AddendumDashboard} />
      <Route path="/strategic-forecast" component={StrategicForecast} />
      <Route path="/methodology-pdf" component={COGRIMethodologyPDF} />
      <Route path="/csi-methodology-pdf" component={CSIMethodologyPDF} />
      <Route path="/phase23-dashboard" component={Phase2Phase3Dashboard} />
      <Route path="/phase23/cogri-analysis" component={COGRIAnalysis} />
      <Route path="/phase23/trading-signals" component={TradingSignals} />
      <Route path="/phase23/risk-management" component={RiskManagement} />
      <Route path="/phase23/data-sources" component={DataSources} />
      <Route path="/phase23/reports" component={Reports} />
      <Route path="/phase23/configuration" component={Configuration} />
      <Route component={NotFound} />
    </Switch>
    <Toaster />
  </>
);

export default App;
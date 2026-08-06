import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Calendar,
  Gauge,
  Fuel,
  Camera,
  X,
  MapPin,
  ChevronDown,
  ThumbsUp,
  MinusCircle,
  ThumbsDown,
  Sparkles,
  ClipboardCheck,
  FileDown,
  MessageCircle,
  Eraser,
  PenLine,
  ShieldCheck,
  Trash2,
  ArrowLeftRight,
  Building2,
  ImagePlus,
  Navigation,
  Save,
  History,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

// NOTA DE DEPENDENCIA: la exportación a PDF usa la librería "jspdf".
// Instálala en tu proyecto con:  npm install jspdf
import jsPDF from "jspdf";

/* -------------------------------------------------------------------------- */
/*  CONFIG / CONSTANTES                                                       */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "maxi_moto_bcn_inspecciones";

const FUEL_LEVELS = [25, 50, 75, 100];

const VIEWS = [
  { id: "frontal", label: "Frontal" },
  { id: "lateral-izq", label: "Lateral Izquierdo" },
  { id: "lateral-der", label: "Lateral Derecho" },
  { id: "trasero", label: "Trasero" },
  { id: "superior", label: "Superior" },
];

const DAMAGE_TYPES = [
  { id: "aranazo", label: "Arañazo" },
  { id: "golpe", label: "Golpe / Abolladura" },
  { id: "rota", label: "Pieza Rota" },
  { id: "desgaste", label: "Desgaste" },
];

const DAMAGE_COLORS = {
  aranazo: "bg-amber-500",
  golpe: "bg-red-600",
  rota: "bg-fuchsia-600",
  desgaste: "bg-orange-500",
};

const CLEANLINESS_OPTIONS = [
  { id: "bueno", label: "Bueno", icon: ThumbsUp, bg: "bg-emerald-500", text: "text-emerald-700" },
  { id: "regular", label: "Regular", icon: MinusCircle, bg: "bg-amber-500", text: "text-amber-700" },
  { id: "malo", label: "Malo", icon: ThumbsDown, bg: "bg-red-500", text: "text-red-700" },
];

const REVISIONS_LIST = [
  { id: "cascos", label: "Limpieza y desinfección de cascos realizada" },
  { id: "lavado", label: "Lavado y limpieza general de la motocicleta" },
  { id: "neumaticos", label: "Presión de neumáticos revisada y ajustada" },
];

const ACCESSORIES_LIST = [
  { id: "casco1", label: "Casco Principal (Talla / ID)" },
  { id: "casco2", label: "Segundo Casco (Opcional)" },
  { id: "soporte", label: "Soporte para teléfono móvil" },
  { id: "candado", label: "Pinza / Candado Antirrobo" },
  { id: "docs", label: "Documentación física y Llaves del vehículo" },
];

const emptyDamagesState = () =>
  VIEWS.reduce((acc, v) => ({ ...acc, [v.id]: [] }), {});

/* -------------------------------------------------------------------------- */
/*  UTIL: fecha/hora actual en formato datetime-local                         */
/* -------------------------------------------------------------------------- */

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/* -------------------------------------------------------------------------- */
/*  SILUETA SVG DEL VEHÍCULO (5 ángulos, ilustración propia)                  */
/* -------------------------------------------------------------------------- */

function ScooterSilhouette({ view }) {
  const stroke = "#1f2937";
  const fill = "#e5e7eb";
  const wheel = "#111827";

  if (view === "lateral-izq" || view === "lateral-der") {
    const flip = view === "lateral-der";
    return (
      <svg
        viewBox="0 0 300 180"
        className="w-full h-full"
        style={{ transform: flip ? "scaleX(-1)" : undefined }}
      >
        <ellipse cx="150" cy="150" rx="130" ry="6" fill="#00000010" />
        <circle cx="65" cy="130" r="30" fill="none" stroke={wheel} strokeWidth="8" />
        <circle cx="65" cy="130" r="10" fill={wheel} />
        <circle cx="235" cy="130" r="30" fill="none" stroke={wheel} strokeWidth="8" />
        <circle cx="235" cy="130" r="10" fill={wheel} />
        <path
          d="M45 120 C40 95 60 78 90 76 L120 76 C130 55 150 40 170 40 L190 40 C205 40 210 55 210 65
             L235 68 C250 70 258 85 258 100 L258 118 L235 118
             C232 100 220 95 205 96 L205 118 L150 118 C140 100 120 96 105 100 L90 118 L45 120 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />
        <path d="M120 76 L200 68 L206 82 L124 90 Z" fill="#9ca3af" stroke={stroke} strokeWidth="2" />
        <line x1="190" y1="40" x2="200" y2="20" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <line x1="200" y1="20" x2="222" y2="18" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <circle cx="224" cy="14" r="5" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="252" cy="92" r="7" fill="#fef3c7" stroke={stroke} strokeWidth="2" />
        <line x1="120" y1="112" x2="150" y2="112" stroke={stroke} strokeWidth="3" />
      </svg>
    );
  }

  if (view === "frontal") {
    return (
      <svg viewBox="0 0 220 200" className="w-full h-full">
        <ellipse cx="110" cy="185" rx="90" ry="6" fill="#00000010" />
        <rect x="90" y="150" width="40" height="34" rx="6" fill={wheel} />
        <path
          d="M60 150 C50 100 65 55 110 40 C155 55 170 100 160 150 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />
        <rect x="85" y="65" width="50" height="26" rx="10" fill="#fef3c7" stroke={stroke} strokeWidth="2" />
        <circle cx="68" cy="95" r="7" fill="#fbbf24" stroke={stroke} strokeWidth="2" />
        <circle cx="152" cy="95" r="7" fill="#fbbf24" stroke={stroke} strokeWidth="2" />
        <line x1="70" y1="45" x2="45" y2="30" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <circle cx="40" cy="26" r="9" fill={fill} stroke={stroke} strokeWidth="2" />
        <line x1="150" y1="45" x2="175" y2="30" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <circle cx="180" cy="26" r="9" fill={fill} stroke={stroke} strokeWidth="2" />
        <path d="M75 140 C90 130 130 130 145 140" fill="none" stroke={stroke} strokeWidth="3" />
      </svg>
    );
  }

  if (view === "trasero") {
    return (
      <svg viewBox="0 0 220 200" className="w-full h-full">
        <ellipse cx="110" cy="185" rx="90" ry="6" fill="#00000010" />
        <rect x="90" y="150" width="40" height="34" rx="6" fill={wheel} />
        <path
          d="M55 150 C48 105 65 62 110 50 C155 62 172 105 165 150 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />
        <rect x="78" y="45" width="64" height="16" rx="6" fill="#9ca3af" stroke={stroke} strokeWidth="2" />
        <rect x="92" y="100" width="36" height="16" rx="6" fill="#fecaca" stroke={stroke} strokeWidth="2" />
        <rect x="88" y="122" width="44" height="18" rx="3" fill="#ffffff" stroke={stroke} strokeWidth="2" />
        <circle cx="65" cy="105" r="6" fill="#fbbf24" stroke={stroke} strokeWidth="2" />
        <circle cx="155" cy="105" r="6" fill="#fbbf24" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  // superior (vista de pájaro)
  return (
    <svg viewBox="0 0 220 320" className="w-full h-full">
      <rect x="18" y="18" width="26" height="10" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
      <rect x="176" y="18" width="26" height="10" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
      <line x1="44" y1="23" x2="70" y2="34" stroke={stroke} strokeWidth="4" />
      <line x1="176" y1="23" x2="150" y2="34" stroke={stroke} strokeWidth="4" />
      <rect x="66" y="30" width="88" height="10" rx="5" fill="#9ca3af" stroke={stroke} strokeWidth="2" />
      <path
        d="M110 46 C160 50 178 90 172 150 C168 210 168 250 150 280
           C138 300 82 300 70 280 C52 250 52 210 48 150 C42 90 60 50 110 46 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="3"
      />
      <rect x="78" y="150" width="64" height="110" rx="14" fill="#9ca3af" stroke={stroke} strokeWidth="2" />
      <rect x="90" y="56" width="40" height="20" rx="8" fill="#fef3c7" stroke={stroke} strokeWidth="2" />
      <rect x="88" y="266" width="44" height="16" rx="3" fill="#ffffff" stroke={stroke} strokeWidth="2" />
      <rect x="30" y="120" width="14" height="46" rx="6" fill={wheel} />
      <rect x="176" y="120" width="14" height="46" rx="6" fill={wheel} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  PANEL DE DAÑOS INTERACTIVO                                                */
/* -------------------------------------------------------------------------- */

function DamageMapPanel({ damages, setDamages }) {
  const [activeView, setActiveView] = useState("frontal");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [form, setForm] = useState({ type: "aranazo", note: "", photo: null });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const activeViewData = VIEWS.find((v) => v.id === activeView);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const selectView = (id) => {
    setActiveView(id);
    setDropdownOpen(false);
    setPendingPoint(null);
  };

  const handleTap = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPendingPoint({ x, y });
    setForm({ type: "aranazo", note: "", photo: null });
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveDamage = () => {
    if (!pendingPoint) return;
    const newMarker = {
      id: `${Date.now()}`,
      x: pendingPoint.x,
      y: pendingPoint.y,
      type: form.type,
      note: form.note,
      photo: form.photo,
    };
    setDamages((prev) => ({
      ...prev,
      [activeView]: [...prev[activeView], newMarker],
    }));
    setPendingPoint(null);
  };

  const removeMarker = (id) => {
    setDamages((prev) => ({
      ...prev,
      [activeView]: prev[activeView].filter((m) => m.id !== id),
    }));
  };

  const currentMarkers = damages[activeView] || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <MapPin size={16} className="text-blue-600" />
          Mapa de Daños
        </h3>
        <span className="text-xs text-gray-400">Toca la silueta para marcar</span>
      </div>

      {/* Selector de ángulo (desplegable) */}
      <div className="relative mb-3" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 flex items-center justify-between text-sm font-semibold text-gray-900 active:bg-gray-100"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span className="flex items-center gap-2">
            <MapPin size={15} className="text-blue-600" />
            {activeViewData.label}
            {damages[activeView]?.length > 0 && (
              <span className="ml-1 h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                {damages[activeView].length}
              </span>
            )}
          </span>
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden"
          >
            {VIEWS.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => selectView(v.id)}
                  role="option"
                  aria-selected={v.id === activeView}
                  className={`w-full h-12 px-4 flex items-center justify-between text-sm text-left transition-colors ${
                    v.id === activeView
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 active:bg-gray-50"
                  }`}
                >
                  {v.label}
                  {damages[v.id]?.length > 0 && (
                    <span className="h-5 min-w-5 px-1 rounded-full bg-gray-200 text-gray-600 text-[11px] font-bold flex items-center justify-center">
                      {damages[v.id].length}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Silueta interactiva */}
      <div
        ref={containerRef}
        onClick={handleTap}
        className={`relative w-full ${
          activeView === "superior" ? "aspect-[3/4]" : "aspect-[4/3]"
        } bg-gray-50 rounded-xl border border-dashed border-gray-200 overflow-hidden cursor-crosshair select-none`}
      >
        <div className="absolute inset-4 pointer-events-none">
          <ScooterSilhouette view={activeView} />
        </div>

        {currentMarkers.map((m) => (
          <button
            key={m.id}
            onClick={(e) => {
              e.stopPropagation();
              removeMarker(m.id);
            }}
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full ${DAMAGE_COLORS[m.type]} ring-2 ring-white shadow-md flex items-center justify-center`}
            title="Toca para eliminar"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </button>
        ))}

        {pendingPoint && (
          <span
            style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-blue-600 ring-4 ring-blue-200 animate-pulse"
          />
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-3">
        {DAMAGE_TYPES.map((t) => (
          <div key={t.id} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`h-2.5 w-2.5 rounded-full ${DAMAGE_COLORS[t.id]}`} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Lista de daños registrados en esta vista */}
      {currentMarkers.length > 0 && (
        <div className="mt-4 space-y-2">
          {currentMarkers.map((m) => (
            <div key={m.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-2.5">
              <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${DAMAGE_COLORS[m.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800">
                  {DAMAGE_TYPES.find((t) => t.id === m.type)?.label}
                </p>
                {m.note && <p className="text-xs text-gray-500 truncate">{m.note}</p>}
              </div>
              {m.photo && (
                <img src={m.photo} alt="Foto del daño" className="h-9 w-9 rounded-md object-cover shrink-0" />
              )}
              <button
                onClick={() => removeMarker(m.id)}
                className="text-gray-400 active:text-red-500 shrink-0 p-1"
                aria-label="Eliminar daño"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de registro de daño */}
      {pendingPoint && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900">Nuevo punto de daño</h4>
              <button
                onClick={() => setPendingPoint(null)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs font-medium text-gray-500 mb-2">Tipo de daño</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DAMAGE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                  className={`h-12 rounded-xl text-sm font-medium border transition-colors ${
                    form.type === t.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <p className="text-xs font-medium text-gray-500 mb-2">Nota descriptiva</p>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Ej: Rayón superficial de 3 cm en carenado lateral"
              rows={2}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium mb-4 cursor-pointer active:bg-gray-50">
              <Camera size={18} />
              {form.photo ? "Foto adjuntada ✓" : "Adjuntar / Tomar foto"}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            </label>

            {form.photo && (
              <img src={form.photo} alt="Vista previa" className="w-full h-32 object-cover rounded-xl mb-4" />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPendingPoint(null)}
                className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-600 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={saveDamage}
                className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAD DE FIRMA DIGITAL (canvas táctil, expone getDataURL vía ref)           */
/* -------------------------------------------------------------------------- */

const SignaturePad = forwardRef(function SignaturePad({ label }, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Expone estos métodos al componente padre (para guardar / exportar a PDF)
  useImperativeHandle(ref, () => ({
    getDataURL: () => (hasSignature ? canvasRef.current.toDataURL("image/png") : null),
    isEmpty: () => !hasSignature,
    clear,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <button
          onClick={clear}
          className="flex items-center gap-1 text-xs text-gray-400 active:text-red-500 h-8 px-2"
        >
          <Eraser size={13} />
          Borrar
        </button>
      </div>
      <div className="relative rounded-xl border border-gray-200 bg-gray-50 h-32 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-300 flex items-center gap-1">
              <PenLine size={14} />
              Firma aquí
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*  COMPONENTE PRINCIPAL                                                      */
/* -------------------------------------------------------------------------- */

export default function VehicleInspectionApp() {
  const [mode, setMode] = useState("checkin"); // 'checkin' | 'checkout'
  const [km, setKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState(100);
  const [damages, setDamages] = useState(emptyDamagesState());
  const [odometerPhoto, setOdometerPhoto] = useState(null);

  // Logística: fechas exactas de entrega / devolución
  const [rentalDateTime, setRentalDateTime] = useState(nowForInput());
  const [returnDateTime, setReturnDateTime] = useState("");

  // Logística: geolocalización GPS
  const [pickupLocation, setPickupLocation] = useState(null);
  const [returnLocation, setReturnLocation] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  // Solo check-out
  const [cleanliness, setCleanliness] = useState(null);
  const [revisions, setRevisions] = useState(
    REVISIONS_LIST.reduce((acc, r) => ({ ...acc, [r.id]: false }), {})
  );
  const [accessories, setAccessories] = useState(
    ACCESSORIES_LIST.reduce((acc, a) => ({ ...acc, [a.id]: false }), {})
  );

  // Historial local
  const [savedRecords, setSavedRecords] = useState([]);

  // Refs de firma (para leer la imagen al guardar / exportar PDF)
  const ownerSigRef = useRef(null);
  const clientSigRef = useRef(null);

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setSavedRecords(existing);
    } catch {
      setSavedRecords([]);
    }
  }, []);

  const toggleRevision = (id) => setRevisions((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleAccessory = (id) => setAccessories((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalDamages = Object.values(damages).reduce((sum, arr) => sum + arr.length, 0);

  const handleOdometerPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOdometerPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  /* --------------------------- GEOLOCALIZACIÓN GPS ------------------------ */
  const captureLocation = (target) => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está disponible en este dispositivo o navegador.");
      return;
    }
    const setLoading = target === "entrega" ? setPickupLoading : setReturnLoading;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        if (target === "entrega") setPickupLocation(loc);
        else setReturnLocation(loc);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        alert("No se pudo obtener la ubicación: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ------------------------- GUARDAR EN LOCALSTORAGE ----------------------- */
  const handleSaveRecord = () => {
    const record = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      mode,
      rentalDateTime,
      returnDateTime,
      km,
      fuelLevel,
      odometerPhoto,
      damages,
      totalDamages,
      pickupLocation,
      returnLocation,
      ...(mode === "checkout" && { cleanliness, revisions, accessories }),
    };
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = [record, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedRecords(updated);
      alert("Registro guardado en el historial local del dispositivo.");
    } catch (err) {
      alert("No se pudo guardar el registro: " + err.message);
    }
  };

  const handleClearHistory = () => {
    if (!window.confirm("¿Eliminar todo el historial guardado en este dispositivo?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setSavedRecords([]);
  };

  /* -------------------------------- PDF ------------------------------------ */
  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 18;

      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Maxi Moto Bcn", 14, y);
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      y += 7;
      doc.text("Reporte de Inspección · Yamaha NMAX 125", 14, y);
      doc.setDrawColor(210);
      y += 3;
      doc.line(14, y, pageWidth - 14, y);

      y += 9;
      doc.setFontSize(10);
      const addLine = (label, value) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, "bold");
        doc.text(`${label}:`, 14, y);
        doc.setFont(undefined, "normal");
        doc.text(String(value ?? "-"), 62, y);
        y += 6;
      };

      addLine("Modo", mode === "checkin" ? "Entrega (Check-in)" : "Devolución (Check-out)");
      addLine("Fecha/hora de Entrega", rentalDateTime || "-");
      addLine("Fecha/hora de Devolución", returnDateTime || "-");
      addLine("Kilometraje", km ? `${km} km` : "-");
      addLine("Nivel de combustible", `${fuelLevel}%`);
      addLine("Daños registrados", totalDamages);
      if (mode === "checkout") {
        addLine("Estado de limpieza", cleanliness || "-");
      }
      if (pickupLocation) {
        addLine("GPS Entrega", `${pickupLocation.lat.toFixed(5)}, ${pickupLocation.lng.toFixed(5)}`);
      }
      if (returnLocation) {
        addLine("GPS Devolución", `${returnLocation.lat.toFixed(5)}, ${returnLocation.lng.toFixed(5)}`);
      }

      y += 4;

      // Foto del tacómetro
      if (odometerPhoto) {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, "bold");
        doc.text("Foto del tacómetro:", 14, y);
        y += 4;
        doc.addImage(odometerPhoto, "JPEG", 14, y, 70, 50);
        y += 56;
      }

      // Fotos de daños
      const damagePhotos = Object.values(damages).flat().filter((d) => d.photo);
      if (damagePhotos.length > 0) {
        if (y > pageHeight - 50) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, "bold");
        doc.text("Fotografías de daños:", 14, y);
        y += 4;
        let x = 14;
        damagePhotos.forEach((d) => {
          if (x + 36 > pageWidth - 14) {
            x = 14;
            y += 42;
          }
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
            x = 14;
          }
          doc.addImage(d.photo, "JPEG", x, y, 36, 36);
          x += 42;
        });
        y += 46;
      }

      // Firmas
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 20;
      }
      doc.setFont(undefined, "bold");
      doc.text("Firmas:", 14, y);
      y += 5;

      const ownerSig = ownerSigRef.current?.getDataURL();
      const clientSig = clientSigRef.current?.getDataURL();

      doc.setFont(undefined, "normal");
      doc.text("Propietario / Arrendador", 14, y);
      doc.text("Cliente / Arrendatario", 105, y);
      if (ownerSig) doc.addImage(ownerSig, "PNG", 14, y + 2, 80, 30);
      if (clientSig) doc.addImage(clientSig, "PNG", 105, y + 2, 80, 30);

      const fileDate = (rentalDateTime || nowForInput()).replace(/[:T]/g, "-");
      doc.save(`inspeccion-nmax125-${fileDate}.pdf`);
    } catch (err) {
      console.error(err);
      alert(
        "No se pudo generar el PDF. Verifica que la dependencia 'jspdf' esté instalada (npm install jspdf)."
      );
    }
  };

  const handleWhatsApp = () => {
    const mapsLink = (loc) => (loc ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : "-");
    const text = encodeURIComponent(
      `Maxi Moto Bcn - Inspección Yamaha NMAX 125\n` +
        `Modo: ${mode === "checkin" ? "Entrega" : "Devolución"}\n` +
        `Entrega: ${rentalDateTime || "-"}\n` +
        `Devolución: ${returnDateTime || "-"}\n` +
        `Km: ${km || "-"}  |  Combustible: ${fuelLevel}%\n` +
        `Daños registrados: ${totalDamages}\n` +
        `Ubicación entrega: ${mapsLink(pickupLocation)}\n` +
        `Ubicación devolución: ${mapsLink(returnLocation)}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* CABECERA CON BRANDING */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 pt-5 pb-4 flex items-center gap-3">
        {/*
          Espacio reservado para el logo oficial de Maxi Moto Bcn.
          Sustituye este bloque por:
          <img src="/logo-maxi-moto-bcn.png" alt="Maxi Moto Bcn"
               className="h-12 w-12 object-contain rounded-xl" />
          usando un export limpio (PNG/SVG) del logo, no una foto.
        */}
        <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
          <Building2 size={22} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Maxi Moto Bcn</h1>
          <p className="text-xs text-gray-400">Registro de Inspección de Vehículo</p>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {/* TARJETA DE VEHÍCULO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Gauge className="text-white" size={26} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 leading-tight">Yamaha NMAX 125</p>
            <p className="text-xs text-gray-400">Scooter Urbana 125cc</p>
          </div>
        </div>

        {/* TABS MODO INSPECCIÓN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1.5">
          <button
            onClick={() => setMode("checkin")}
            className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-colors ${
              mode === "checkin" ? "bg-gray-900 text-white" : "text-gray-500"
            }`}
          >
            Entrega (Check-in)
          </button>
          <button
            onClick={() => setMode("checkout")}
            className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-colors ${
              mode === "checkout" ? "bg-gray-900 text-white" : "text-gray-500"
            }`}
          >
            Devolución (Check-out)
          </button>
        </div>

        {/* DATOS GENERALES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Datos Generales</h3>

          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
              <Gauge size={14} />
              Kilometraje actual
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder="0"
                className="w-full h-12 rounded-xl border border-gray-200 pl-3 pr-12 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                km
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
              <Fuel size={14} />
              Nivel de combustible
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FUEL_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFuelLevel(lvl)}
                  className={`h-12 rounded-xl text-sm font-semibold border transition-colors ${
                    fuelLevel === lvl
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {lvl}%
                </button>
              ))}
            </div>
          </div>

          {/* FOTO DEL TACÓMETRO */}
          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
              <Camera size={14} />
              Foto del tacómetro (km y combustible reales)
            </label>
            <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium cursor-pointer active:bg-gray-50">
              <ImagePlus size={18} />
              {odometerPhoto ? "Foto adjuntada ✓" : "Tomar / adjuntar foto del tacómetro"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOdometerPhoto}
                className="hidden"
              />
            </label>
            {odometerPhoto && (
              <div className="relative mt-2">
                <img
                  src={odometerPhoto}
                  alt="Foto del tacómetro"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  onClick={() => setOdometerPhoto(null)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  aria-label="Quitar foto"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LOGÍSTICA: FECHAS Y GEOLOCALIZACIÓN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Navigation size={16} className="text-blue-600" />
            Logística de Fechas y Geolocalización
          </h3>

          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} />
              Fecha/hora exacta de Alquiler (Entrega)
            </label>
            <input
              type="datetime-local"
              value={rentalDateTime}
              onChange={(e) => setRentalDateTime(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} />
              Fecha/hora exacta de Devolución
            </label>
            <input
              type="datetime-local"
              value={returnDateTime}
              onChange={(e) => setReturnDateTime(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* GPS Entrega */}
          <div>
            <button
              onClick={() => captureLocation("entrega")}
              disabled={pickupLoading}
              className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-100 disabled:opacity-60"
            >
              {pickupLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Navigation size={16} className="text-blue-600" />
              )}
              {pickupLoading ? "Obteniendo ubicación..." : "Capturar Ubicación de Entrega"}
            </button>
            {pickupLocation && (
              <div className="mt-2 flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-700 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  {pickupLocation.lat.toFixed(5)}, {pickupLocation.lng.toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${pickupLocation.lat},${pickupLocation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-medium flex items-center gap-0.5"
                >
                  Ver mapa <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* GPS Devolución */}
          <div>
            <button
              onClick={() => captureLocation("devolucion")}
              disabled={returnLoading}
              className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-100 disabled:opacity-60"
            >
              {returnLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Navigation size={16} className="text-emerald-600" />
              )}
              {returnLoading ? "Obteniendo ubicación..." : "Capturar Ubicación de Devolución"}
            </button>
            {returnLocation && (
              <div className="mt-2 flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                <span className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  {returnLocation.lat.toFixed(5)}, {returnLocation.lng.toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${returnLocation.lat},${returnLocation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 font-medium flex items-center gap-0.5"
                >
                  Ver mapa <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* MAPA DE DAÑOS */}
        <DamageMapPanel damages={damages} setDamages={setDamages} />

        {/* MÓDULO EXCLUSIVO CHECK-OUT */}
        {mode === "checkout" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <Sparkles size={16} className="text-blue-600" />
                Estado de Limpieza
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {CLEANLINESS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = cleanliness === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setCleanliness(opt.id)}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                        active ? `${opt.bg} border-transparent text-white` : `bg-white border-gray-200 ${opt.text}`
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <ClipboardCheck size={16} className="text-blue-600" />
                Revisiones Puntuales
              </h3>
              <div className="space-y-1">
                {REVISIONS_LIST.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 h-12 px-1 cursor-pointer active:bg-gray-50 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={revisions[r.id]}
                      onChange={() => toggleRevision(r.id)}
                      className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <span className="text-sm text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <ShieldCheck size={16} className="text-blue-600" />
                Checklist de Accesorios Entregados / Devueltos
              </h3>
              <div className="space-y-1">
                {ACCESSORIES_LIST.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 h-12 px-1 cursor-pointer active:bg-gray-50 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={accessories[a.id]}
                      onChange={() => toggleAccessory(a.id)}
                      className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <span className="text-sm text-gray-700">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* FIRMAS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <PenLine size={16} className="text-blue-600" />
            Firmas
          </h3>
          <SignaturePad ref={ownerSigRef} label="Firma del Propietario / Arrendador" />
          <SignaturePad ref={clientSigRef} label="Firma del Cliente / Arrendatario" />
        </div>

        {/* HISTORIAL LOCAL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <History size={16} className="text-blue-600" />
              Historial de Entregas (este dispositivo)
            </h3>
            {savedRecords.length > 0 && (
              <button onClick={handleClearHistory} className="text-xs text-gray-400 active:text-red-500">
                Vaciar
              </button>
            )}
          </div>
          {savedRecords.length === 0 ? (
            <p className="text-xs text-gray-400">Aún no hay registros guardados en este dispositivo.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {savedRecords.slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {r.mode === "checkin" ? "Entrega" : "Devolución"} · {r.km || "-"} km
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(r.savedAt).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400">{r.totalDamages} daño(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RESUMEN RÁPIDO */}
        <div className="flex items-center justify-between bg-blue-50 rounded-2xl px-4 py-3 text-xs text-blue-700">
          <span className="flex items-center gap-1.5">
            <ArrowLeftRight size={14} />
            {mode === "checkin" ? "Modo Entrega" : "Modo Devolución"}
          </span>
          <span>{totalDamages} daño(s) registrado(s)</span>
        </div>

        {/* ACCIONES FINALES */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleSaveRecord}
            className="w-full h-14 rounded-2xl bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:bg-gray-800"
          >
            <Save size={18} />
            Guardar Registro en Historial
          </button>
          <button
            onClick={handleGeneratePDF}
            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:bg-blue-700"
          >
            <FileDown size={18} />
            Generar Reporte y Guardar PDF
          </button>
          <button
            onClick={handleWhatsApp}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:bg-emerald-700"
          >
            <MessageCircle size={18} />
            Enviar Resumen por WhatsApp
          </button>
        </div>
      </main>
    </div>
  );
}

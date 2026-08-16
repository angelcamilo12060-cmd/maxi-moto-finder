import React, { useEffect, useRef, useState } from "react";
import { Lock, Delete, ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";

const PIN_KEY = "maxi_moto_bcn_pin";
const SESSION_KEY = "maxi_moto_bcn_sesion";
const PIN_LENGTH = 4;

async function hashPin(pin) {
  const data = new TextEncoder().encode(`maxi-moto-bcn::${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function Keypad({ value, onDigit, onDelete, disabled }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <>
      <div className="flex justify-center gap-3 mb-8">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full transition-all duration-200 ${
              i < value.length ? "bg-gray-900 scale-110" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
        {keys.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => (k === "del" ? onDelete() : onDigit(k))}
              className="h-16 rounded-2xl bg-white border border-gray-200 text-xl font-semibold text-gray-800 flex items-center justify-center shadow-sm transition-transform duration-100 hover:bg-gray-50 active:scale-95 disabled:opacity-50"
            >
              {k === "del" ? <Delete size={20} className="text-gray-500" /> : k}
            </button>
          )
        )}
      </div>
    </>
  );
}

export default function PinLock({ children }) {
  const [ready, setReady] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState("crear"); // crear | confirmar
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(PIN_KEY);
    setHasPin(Boolean(stored));
    if (stored && sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
    setReady(true);
  }, []);

  const fail = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const submit = async (code) => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (!hasPin) {
        if (stage === "crear") {
          setConfirmPin(code);
          setStage("confirmar");
          setPin("");
          setError("");
        } else {
          if (code !== confirmPin) {
            setStage("crear");
            setConfirmPin("");
            setPin("");
            fail("Los códigos no coinciden. Inténtalo de nuevo.");
          } else {
            localStorage.setItem(PIN_KEY, await hashPin(code));
            sessionStorage.setItem(SESSION_KEY, "1");
            setHasPin(true);
            setUnlocked(true);
            toast.success("Código creado", { description: "Ya puedes acceder a la app." });
          }
        }
      } else {
        const ok = (await hashPin(code)) === localStorage.getItem(PIN_KEY);
        if (ok) {
          sessionStorage.setItem(SESSION_KEY, "1");
          setUnlocked(true);
          setError("");
        } else {
          setPin("");
          fail("Código incorrecto.");
        }
      }
    } finally {
      busy.current = false;
    }
  };

  const onDigit = (d) => {
    setError("");
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + d;
      if (next.length === PIN_LENGTH) setTimeout(() => submit(next), 120);
      return next;
    });
  };

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setPin("");
    toast("Sesión bloqueada");
  };

  const resetPin = () => {
    localStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setHasPin(false);
    setUnlocked(false);
    setPin("");
    setConfirmPin("");
    setStage("crear");
    toast("Código eliminado. Crea uno nuevo.");
  };

  if (!ready) return <div className="min-h-screen bg-gray-50" />;

  if (unlocked) {
    return (
      <div className="relative">
        {children}
        <button
          onClick={lock}
          className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
          aria-label="Bloquear aplicación"
          title="Bloquear aplicación"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  const titleText = !hasPin
    ? stage === "crear"
      ? "Crea tu código de acceso"
      : "Repite el código"
    : "Introduce tu código";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-10">
      <div className={`w-full max-w-sm text-center ${shake ? "animate-[shake_0.4s]" : ""}`}>
        <div className="h-16 w-16 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
          {hasPin ? <Lock size={26} className="text-orange-400" /> : <ShieldCheck size={26} className="text-orange-400" />}
        </div>
        <h1 className="text-xl font-bold text-gray-900">Maxi Moto Bcn</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">{titleText}</p>

        <Keypad value={pin} onDigit={onDigit} onDelete={() => setPin((p) => p.slice(0, -1))} />

        <p className={`text-xs mt-6 min-h-[16px] ${error ? "text-red-500" : "text-gray-400"}`}>
          {error || (hasPin ? "Acceso protegido en este dispositivo" : "Usa 4 dígitos fáciles de recordar")}
        </p>

        {hasPin && (
          <button
            onClick={resetPin}
            className="mt-6 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
          >
            He olvidado mi código
          </button>
        )}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

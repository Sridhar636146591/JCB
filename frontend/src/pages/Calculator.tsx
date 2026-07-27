import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Clock, Trash2 } from 'lucide-react';

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [justEvaluated, setJustEvaluated] = useState(false);

  // --- Core Logic ---
  const input = useCallback((val: string) => {
    setDisplay(prev => {
      if (justEvaluated && /[0-9.]/.test(val)) {
        setExpression('');
        setJustEvaluated(false);
        return val;
      }
      setJustEvaluated(false);
      if (prev === '0' && /[0-9]/.test(val)) return val;
      if (val === '.' && prev.includes('.')) return prev;
      if (prev.length >= 15) return prev;
      return prev + val;
    });
  }, [justEvaluated]);

  const operator = useCallback((op: string) => {
    setJustEvaluated(false);
    setExpression(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
  }, [display]);

  const evaluate = useCallback(() => {
    try {
      const expr = expression + display;
      if (!expression) return;
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr.replace(/×/g, '*').replace(/÷/g, '/') + ')')();
      const resultStr = parseFloat(result.toFixed(10)).toString();
      setHistory(h => [`${expr} = ${resultStr}`, ...h].slice(0, 20));
      setExpression(expr + ' =');
      setDisplay(resultStr);
      setJustEvaluated(true);
    } catch {
      setDisplay('Error');
      setExpression('');
      setJustEvaluated(true);
    }
  }, [expression, display]);

  const clear = () => { setDisplay('0'); setExpression(''); setJustEvaluated(false); };
  const backspace = () => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  const toggleSign = () => setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : prev === '0' ? '0' : '-' + prev);
  const percent = () => setDisplay(prev => String(parseFloat(prev) / 100));

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key >= '0' && e.key <= '9') input(e.key);
      else if (e.key === '.') input('.');
      else if (e.key === '+') operator('+');
      else if (e.key === '-') operator('-');
      else if (e.key === '*') operator('×');
      else if (e.key === '/') { e.preventDefault(); operator('÷'); }
      else if (e.key === 'Enter' || e.key === '=') evaluate();
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') clear();
      else if (e.key === '%') percent();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [input, operator, evaluate]);

  const formatDisplay = (val: string) => {
    if (val === 'Error') return val;
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    // Keep decimal part as-is
    const parts = val.split('.');
    const intPart = new Intl.NumberFormat('en-IN').format(parseInt(parts[0], 10));
    return parts.length > 1 ? intPart + '.' + parts[1] : intPart;
  };

  const buttons = [
    { label: 'AC',  action: clear,          style: 'bg-slate-500 hover:bg-slate-400 text-white text-base' },
    { label: '+/-', action: toggleSign,     style: 'bg-slate-500 hover:bg-slate-400 text-white text-base' },
    { label: '%',   action: percent,        style: 'bg-slate-500 hover:bg-slate-400 text-white text-base' },
    { label: '÷',   action: () => operator('÷'), style: 'bg-amber-500 hover:bg-amber-400 text-slate-900 text-2xl font-black' },
    { label: '7',   action: () => input('7'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '8',   action: () => input('8'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '9',   action: () => input('9'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '×',   action: () => operator('×'), style: 'bg-amber-500 hover:bg-amber-400 text-slate-900 text-2xl font-black' },
    { label: '4',   action: () => input('4'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '5',   action: () => input('5'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '6',   action: () => input('6'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '-',   action: () => operator('-'), style: 'bg-amber-500 hover:bg-amber-400 text-slate-900 text-2xl font-black' },
    { label: '1',   action: () => input('1'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '2',   action: () => input('2'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '3',   action: () => input('3'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '+',   action: () => operator('+'), style: 'bg-amber-500 hover:bg-amber-400 text-slate-900 text-2xl font-black' },
    { label: '⌫',   action: backspace,      style: 'bg-slate-600 hover:bg-slate-500 text-white' },
    { label: '0',   action: () => input('0'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '.',   action: () => input('.'), style: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { label: '=',   action: evaluate,       style: 'bg-amber-500 hover:bg-amber-400 text-slate-900 text-2xl font-black' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Calculator</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Quick calculations with Indian number formatting &amp; history. Keyboard supported.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Calculator Body ── */}
        <div className="lg:col-span-3 bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/60">

          {/* Display */}
          <div className="px-6 pt-7 pb-4 text-right select-none">
            <p className="text-slate-500 text-sm font-mono min-h-[20px] truncate">{expression}&nbsp;</p>
            <p
              className={`text-white font-black tracking-tight mt-1 truncate transition-all ${
                display.length > 10 ? 'text-3xl' : 'text-5xl'
              }`}
            >
              {formatDisplay(display)}
            </p>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-[10px] text-slate-600 font-semibold pb-2 tracking-wider uppercase">
            Keyboard enabled — press Esc to clear
          </p>

          {/* Button Grid */}
          <div className="grid grid-cols-4 gap-px bg-slate-950/80 border-t border-slate-800">
            {buttons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className={`${btn.style} text-xl font-bold py-6 transition-all duration-100 active:scale-95 active:brightness-90 cursor-pointer select-none`}
              >
                {btn.label === '⌫'
                  ? <span className="flex items-center justify-center"><Delete size={20} /></span>
                  : btn.label
                }
              </button>
            ))}
          </div>
        </div>

        {/* ── History Panel ── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Calculation History
              </h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 font-bold uppercase tracking-wider cursor-pointer transition"
              >
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Clock size={20} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-xs text-slate-400 font-semibold">No calculations yet.<br />Start typing to see history here.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
              {history.map((h, i) => {
                const [expr, res] = h.split(' = ');
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setDisplay(res);
                      setExpression('');
                      setJustEvaluated(true);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition group ${
                      i === 0
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">{expr}</p>
                    <p className={`text-sm font-black font-mono mt-0.5 ${
                      i === 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      = {formatDisplay(res)}
                    </p>
                    <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1 group-hover:text-slate-400 transition">
                      Click to reuse result
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-300 dark:text-slate-700 font-semibold text-center">
              Numbers formatted in Indian system (e.g. 1,00,000)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;

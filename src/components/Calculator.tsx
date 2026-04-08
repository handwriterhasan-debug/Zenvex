import { useState } from 'react';
import { Calculator as CalculatorIcon, Delete } from 'lucide-react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    
    if (equation && display !== '0') {
      try {
        const result = new Function('return ' + equation + display)();
        setEquation(result + ' ' + op + ' ');
        setDisplay('0');
      } catch (e) {
        setDisplay('Error');
        setEquation('');
      }
    } else if (equation && display === '0') {
      // Change operator
      setEquation(equation.slice(0, -2) + op + ' ');
    } else {
      setEquation(display + ' ' + op + ' ');
      setDisplay('0');
    }
  };

  const calculate = () => {
    if (!equation || display === 'Error') return;
    try {
      const result = new Function('return ' + equation + display)();
      setDisplay(String(Number(result.toFixed(4))));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  return (
    <div className="bg-surface border border-border-dim p-6 rounded-3xl shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <CalculatorIcon className="w-5 h-5 text-accent-primary" />
        <h2 className="text-xl font-bold font-display text-text-main">Calculator</h2>
      </div>

      <div className="bg-surface-light p-4 rounded-xl border border-border-dim mb-4 text-right overflow-hidden">
        <div className="text-text-muted text-sm h-5 mb-1">{equation}</div>
        <div className="text-3xl font-mono font-bold text-text-main truncate">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className="col-span-2 p-4 bg-accent-primary-dim text-accent-primary hover:bg-accent-primary-dim rounded-xl font-bold transition-colors">C</button>
        <button onClick={deleteLast} className="p-4 bg-surface-light hover:bg-surface-hover text-text-main rounded-xl flex items-center justify-center transition-colors"><Delete className="w-5 h-5" /></button>
        <button onClick={() => handleOperator('/')} className="p-4 bg-surface-light hover:bg-surface-hover text-accent-primary rounded-xl font-bold transition-colors">÷</button>

        <button onClick={() => handleNumber('7')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">7</button>
        <button onClick={() => handleNumber('8')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">8</button>
        <button onClick={() => handleNumber('9')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">9</button>
        <button onClick={() => handleOperator('*')} className="p-4 bg-surface-light hover:bg-surface-hover text-accent-primary rounded-xl font-bold transition-colors">×</button>

        <button onClick={() => handleNumber('4')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">4</button>
        <button onClick={() => handleNumber('5')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">5</button>
        <button onClick={() => handleNumber('6')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">6</button>
        <button onClick={() => handleOperator('-')} className="p-4 bg-surface-light hover:bg-surface-hover text-accent-primary rounded-xl font-bold transition-colors">-</button>

        <button onClick={() => handleNumber('1')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">1</button>
        <button onClick={() => handleNumber('2')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">2</button>
        <button onClick={() => handleNumber('3')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">3</button>
        <button onClick={() => handleOperator('+')} className="p-4 bg-surface-light hover:bg-surface-hover text-accent-primary rounded-xl font-bold transition-colors">+</button>

        <button onClick={() => handleNumber('0')} className="col-span-2 p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">0</button>
        <button onClick={() => handleNumber('.')} className="p-4 bg-surface hover:bg-surface-hover text-text-main rounded-xl font-bold transition-colors">.</button>
        <button onClick={calculate} className="p-4 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl font-bold transition-colors shadow-sm">=</button>
      </div>
    </div>
  );
}

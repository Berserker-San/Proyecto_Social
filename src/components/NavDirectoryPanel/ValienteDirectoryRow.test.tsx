/**
 * Tests for ValienteDirectoryRow
 *
 * Validates: Requirement 3.5
 */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import ValienteDirectoryRow from './ValienteDirectoryRow';
import type { ValienteListItem } from '../../lib/utils/valienteHelpers';

// =========================================================
// ARBITRARIES
// =========================================================

/** Genera un string no vacío de letras */
const nonEmptyString = fc.stringMatching(/^[A-Za-záéíóúÁÉÍÓÚñÑ ]{1,30}$/).filter(s => s.trim().length > 0);

/** Genera un ValienteListItem con estado INACTIVO o EGRESADO */
const inactiveValienteArb: fc.Arbitrary<ValienteListItem> = fc.record({
  id: fc.integer({ min: 1, max: 9999 }),
  nombres: nonEmptyString,
  apellidos: nonEmptyString,
  nombre_completo: fc.option(nonEmptyString, { nil: undefined }),
  numero_documento: fc.stringMatching(/^[0-9]{6,12}$/),
  tipo_documento: fc.constantFrom('CC', 'TI', 'CE'),
  foto_url: fc.constant(null),
  estado: fc.constantFrom('INACTIVO', 'EGRESADO'),
  programas: fc.constant(undefined),
});

/** Genera un ValienteListItem con estado ACTIVO */
const activeValienteArb: fc.Arbitrary<ValienteListItem> = fc.record({
  id: fc.integer({ min: 1, max: 9999 }),
  nombres: nonEmptyString,
  apellidos: nonEmptyString,
  nombre_completo: fc.option(nonEmptyString, { nil: undefined }),
  numero_documento: fc.stringMatching(/^[0-9]{6,12}$/),
  tipo_documento: fc.constantFrom('CC', 'TI', 'CE'),
  foto_url: fc.constant(null),
  estado: fc.constant('ACTIVO'),
  programas: fc.constant(undefined),
});

// =========================================================
// PROPERTY TEST
// =========================================================

/**
 * Property 7: Filas con estado inactivo tienen indicador visual
 *
 * Para cualquier valiente con estado === 'INACTIVO' o 'EGRESADO',
 * el componente ValienteDirectoryRow debe incluir la clase CSS de
 * opacidad reducida ('opacity-50') en su output renderizado.
 *
 * Validates: Requirement 3.5
 */
describe('ValienteDirectoryRow — Property 7: indicador visual de inactividad', () => {
  it('aplica opacity-50 para cualquier valiente INACTIVO o EGRESADO', () => {
    fc.assert(
      fc.property(inactiveValienteArb, (valiente) => {
        const { container } = render(
          <ValienteDirectoryRow
            valiente={valiente}
            isSelected={false}
            onClick={vi.fn()}
          />
        );
        const button = container.querySelector('button');
        expect(button).not.toBeNull();
        expect(button!.className).toContain('opacity-50');
      }),
      { numRuns: 50 }
    );
  });

  it('NO aplica opacity-50 para valientes ACTIVOS', () => {
    fc.assert(
      fc.property(activeValienteArb, (valiente) => {
        const { container } = render(
          <ValienteDirectoryRow
            valiente={valiente}
            isSelected={false}
            onClick={vi.fn()}
          />
        );
        const button = container.querySelector('button');
        expect(button).not.toBeNull();
        expect(button!.className).not.toContain('opacity-50');
      }),
      { numRuns: 50 }
    );
  });
});

// =========================================================
// UNIT TESTS
// =========================================================

describe('ValienteDirectoryRow — unit tests', () => {
  const baseValiente: ValienteListItem = {
    id: 1,
    nombres: 'Juan',
    apellidos: 'Pérez',
    nombre_completo: undefined,
    numero_documento: '12345678',
    tipo_documento: 'CC',
    foto_url: null,
    estado: 'ACTIVO',
  };

  it('muestra el nombre completo derivado de nombres + apellidos', () => {
    const { getByText } = render(
      <ValienteDirectoryRow valiente={baseValiente} isSelected={false} onClick={vi.fn()} />
    );
    expect(getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('muestra nombre_completo cuando está disponible', () => {
    const v = { ...baseValiente, nombre_completo: 'Juan Carlos Pérez López' };
    const { getByText } = render(
      <ValienteDirectoryRow valiente={v} isSelected={false} onClick={vi.fn()} />
    );
    expect(getByText('Juan Carlos Pérez López')).toBeInTheDocument();
  });

  it('muestra el numero_documento', () => {
    const { getByText } = render(
      <ValienteDirectoryRow valiente={baseValiente} isSelected={false} onClick={vi.fn()} />
    );
    expect(getByText('12345678')).toBeInTheDocument();
  });

  it('aplica estilo de selección cuando isSelected es true', () => {
    const { container } = render(
      <ValienteDirectoryRow valiente={baseValiente} isSelected={true} onClick={vi.fn()} />
    );
    const button = container.querySelector('button');
    expect(button!.className).toContain('bg-white/10');
    expect(button!.className).toContain('border-white/20');
  });

  it('NO aplica estilo de selección cuando isSelected es false', () => {
    const { container } = render(
      <ValienteDirectoryRow valiente={baseValiente} isSelected={false} onClick={vi.fn()} />
    );
    const button = container.querySelector('button');
    expect(button!.className).not.toContain('bg-white/10');
  });

  it('muestra badges de programa TRIBU y SOROCA', () => {
    const v: ValienteListItem = {
      ...baseValiente,
      programas: [
        { programa: { codigo: 'TRIBU' } },
        { programa: { codigo: 'SOROCA' } },
      ],
    };
    const { getByText } = render(
      <ValienteDirectoryRow valiente={v} isSelected={false} onClick={vi.fn()} />
    );
    expect(getByText('TRIBU')).toBeInTheDocument();
    expect(getByText('SOROCA')).toBeInTheDocument();
  });

  it('invoca onClick al hacer click', async () => {
    const handleClick = vi.fn();
    const { container } = render(
      <ValienteDirectoryRow valiente={baseValiente} isSelected={false} onClick={handleClick} />
    );
    const button = container.querySelector('button')!;
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('muestra avatar con iniciales cuando foto_url es null', () => {
    const { getByText } = render(
      <ValienteDirectoryRow valiente={baseValiente} isSelected={false} onClick={vi.fn()} />
    );
    // Iniciales: J (Juan) + P (Pérez)
    expect(getByText('JP')).toBeInTheDocument();
  });
});

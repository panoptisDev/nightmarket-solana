import clsx from 'clsx';
import type { ReactNode } from 'react';

export enum FlexDirection {
  Col = 'flex-col',
  Row = 'flex-row',
}

export enum FlexJustify {
  Center = 'justify-center',
  Between = 'justify-between',
  Start = 'justify-start',
}

export enum FlexAlign {
  Center = 'items-center',
  Between = 'items-between',
  Start = 'items-start',
}

interface FlexProps {
  direction?: FlexDirection;
  children: ReactNode;
  className?: string;
  align?: FlexAlign;
  justify?: FlexJustify;
  block?: boolean;
  gap?: number;
}

export default function Flex({
  children,
  direction = FlexDirection.Row,
  align,
  justify,
  className,
  block = false,
  gap = 0,
}: FlexProps): JSX.Element {
  return (
    <div
      className={clsx(
        'flex',
        direction,
        align,
        justify,
        `gap-${gap}`,
        { 'w-full': block },
        className
      )}
    >
      {children}
    </div>
  );
}

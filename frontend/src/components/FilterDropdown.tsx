import type { ReactNode } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
export default function FilterDropdown({children}:{children:ReactNode}) {
  return <details className="filter-dropdown"><summary><SlidersHorizontal size={16}/>Filters<ChevronDown size={16}/></summary><div className="filter-dropdown-content">{children}</div></details>;
}

import React, { useMemo } from 'react';
import { Search, X, Filter, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  coach?: string;
  nivel?: string;
  info?: string;
  volume?: string;
  distances?: string[];
  path?: string;
}

interface Filters {
  searchTerm: string;
  level: string;
  trainer: string;
  volume: string;
  distance: string;
  duration?: string;
  type?: string;
}

interface QuickFilter {
  label: string;
  type: keyof Filters;
  value: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { label: '5K', type: 'distance', value: '5km' },
  { label: '10K', type: 'distance', value: '10km' },
  { label: '21K', type: 'distance', value: '21km' },
  { label: '42K', type: 'distance', value: '42km' },
  { label: 'Iniciante', type: 'level', value: 'iniciante' },
  { label: 'Intermediário', type: 'level', value: 'intermediário' },
  { label: 'Avançado', type: 'level', value: 'avançado' },
  { label: 'Elite', type: 'level', value: 'elite' }
];

const FILTER_LABELS: Record<string, string> = {
  level: 'Nível',
  trainer: 'Treinador',
  volume: 'Volume',
  distance: 'Distância',
  duration: 'Duração',
  type: 'Tipo'
};

interface EnhancedSearchProps {
  filters: Filters;
  allPlans: Plan[];
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
}

export function EnhancedSearch({ filters, allPlans, onFilterChange, onClearFilters }: EnhancedSearchProps) {
  const [isFiltersOpen, setIsFiltersOpen] = React.useState<boolean>(false);
  const [commandSearch, setCommandSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<string>("all");

  // Generate unique filter options from the data
  const availableFilters = useMemo(() => {
    // Function to get unique values and sort them
    const getUniqueValues = (key: keyof Plan): string[] => {
      return Array.from(new Set(
        allPlans
          .map(plan => key === 'coach' ? plan[key]?.toLowerCase() : plan[key])
          .filter((value): value is string => Boolean(value))
      )).sort();
    };

    // Sort levels in a specific order
    const sortNiveis = (niveis: string[]): string[] => {
      const order = ["iniciante", "intermediário", "avançado", "elite"];
      return niveis.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    };

    // Get unique volumes and sort numerically
    const getUniqueVolumes = (): string[] => {
      return Array.from(new Set(
        allPlans
          .map(plan => plan.volume)
          .filter((value): value is string => Boolean(value))
      )).sort((a, b) => parseInt(a) - parseInt(b));
    };

    // Get all unique distances across all plans
    const uniqueDistances = Array.from(new Set(
      allPlans
        .flatMap(plan => plan.distances || [])
        .filter(Boolean)
    ));

    // Create QuickFilter objects for each filter type
    const levelFilters: QuickFilter[] = sortNiveis(getUniqueValues('nivel'))
      .map(level => ({ label: level.charAt(0).toUpperCase() + level.slice(1), type: 'level', value: level }));

    const trainerFilters: QuickFilter[] = getUniqueValues('coach')
      .map(trainer => ({ label: trainer.charAt(0).toUpperCase() + trainer.slice(1), type: 'trainer', value: trainer }));

    const volumeFilters: QuickFilter[] = getUniqueVolumes()
      .map(volume => ({ label: `${volume} km/semana`, type: 'volume', value: volume }));

    const distanceFilters: QuickFilter[] = uniqueDistances
      .map(distance => ({ label: distance, type: 'distance', value: distance }));

    return {
      level: levelFilters,
      trainer: trainerFilters,
      volume: volumeFilters,
      distance: distanceFilters,
      all: [...levelFilters, ...trainerFilters, ...volumeFilters, ...distanceFilters]
    };
  }, [allPlans]);

  // Check if a filter is currently active
  const isFilterActive = (type: keyof Filters, value: string): boolean => {
    return filters[type] === value;
  };

  // Toggle a filter on/off
  const toggleFilter = (filter: QuickFilter) => {
    const currentValue = filters[filter.type];
    const defaultValue = filter.type === 'distance' ? 'todas' : 
                        (filter.type === 'volume' || filter.type === 'duration') ? 'qualquer' : 'todos';
                        
    onFilterChange(
      filter.type, 
      currentValue === filter.value ? defaultValue : filter.value
    );
  };

  // Filter the available filters by search term and active tab
  const filteredByTypeAndSearch = useMemo(() => {
    let filtered = availableFilters.all;
    
    // Filter by search term
    if (commandSearch) {
      filtered = filtered.filter(
        (filter) =>
          filter.label.toLowerCase().includes(commandSearch.toLowerCase()) ||
          FILTER_LABELS[filter.type]?.toLowerCase().includes(commandSearch.toLowerCase()),
      );
    }
    
    // Filter by selected tab
    if (activeTab !== "all") {
      filtered = filtered.filter((filter) => filter.type === activeTab);
    }
    
    return filtered;
  }, [availableFilters.all, commandSearch, activeTab]);

  // Find all active filters
  const activeFilters = Object.entries(filters).filter(([key, value]) => 
    key !== 'searchTerm' && 
    value !== 'todos' && 
    value !== 'todas' && 
    value !== 'qualquer'
  );

  // Format filter values for display
  const formatFilterValue = (key: string, value: string): string => {
    if (key === 'volume' && value !== 'qualquer') {
      return `${value} km/semana`;
    }
    return value;
  };

  // Define custom colors for level badges
  const getLevelBadgeStyles = (level: string, isActive: boolean): string => {
    if (isActive) {
      switch (level) {
        case 'iniciante': return 'bg-emerald-600 hover:bg-emerald-700';
        case 'intermediário': return 'bg-blue-600 hover:bg-blue-700';
        case 'avançado': return 'bg-purple-600 hover:bg-purple-700';
        case 'elite': return 'bg-rose-600 hover:bg-rose-700';
        default: return '';
      }
    } else {
      switch (level) {
        case 'iniciante': return 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30';
        case 'intermediário': return 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30';
        case 'avançado': return 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30';
        case 'elite': return 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30';
        default: return '';
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Search and Filter Row */}
      <div className="flex items-center gap-2 bg-card border border-border/40 dark:bg-muted/30 backdrop-blur-sm rounded-md p-3">
        <div className="relative flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar planos de treino..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange('searchTerm', e.target.value)}
              className="pl-9 pr-2 h-10"
            />
            {filters.searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full hover:bg-muted"
                onClick={() => onFilterChange('searchTerm', '')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpar pesquisa</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Popover Button */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-1 whitespace-nowrap">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="font-medium">Filtrar Planos</h3>
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearFilters();
                    setIsFiltersOpen(false);
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpar tudo
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-2 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1 text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="distance" className="flex-1 text-xs">Distância</TabsTrigger>
                  <TabsTrigger value="level" className="flex-1 text-xs">Nível</TabsTrigger>
                  <TabsTrigger value="trainer" className="flex-1 text-xs">Treinador</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar filtros..." 
                    value={commandSearch} 
                    onValueChange={setCommandSearch} 
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum filtro encontrado.</CommandEmpty>
                    <ScrollArea className="h-60">
                      {filteredByTypeAndSearch.length > 0 ? (
                        <div className="p-1">
                          {Object.entries(FILTER_LABELS).map(([type, label]) => {
                            const typeFilters = filteredByTypeAndSearch.filter(f => f.type === type);
                            if (typeFilters.length === 0) return null;
                            return (
                              <div key={type} className="mb-3">
                                <div className="text-xs font-medium text-muted-foreground mb-1 px-2">
                                  {label}
                                </div>
                                {typeFilters.map((filter) => {
                                  const isSelected = isFilterActive(filter.type, filter.value);
                                  return (
                                    <CommandItem
                                      key={`cmd-${filter.type}-${filter.value}`}
                                      onSelect={() => toggleFilter(filter)}
                                      className="flex items-center gap-2 px-2 py-1.5"
                                    >
                                      <div className={cn(
                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                      )}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <span className="truncate">{filter.label}</span>
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Nenhum filtro encontrado para essa categoria.
                        </div>
                      )}
                    </ScrollArea>
                  </CommandList>
                </Command>
              </TabsContent>
              
              <TabsContent value="distance" className="mt-0">
                <ScrollArea className="h-60 px-2 py-1">
                  {availableFilters.distance.length > 0 ? (
                    availableFilters.distance.map((filter) => {
                      const isSelected = isFilterActive(filter.type, filter.value);
                      return (
                        <div
                          key={`tab-${filter.type}-${filter.value}`}
                          className={cn(
                            "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer",
                            isSelected ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleFilter(filter)}
                        >
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span>{filter.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Nenhuma distância disponível.
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="level" className="mt-0">
                <ScrollArea className="h-60 px-2 py-1">
                  {availableFilters.level.length > 0 ? (
                    availableFilters.level.map((filter) => {
                      const isSelected = isFilterActive(filter.type, filter.value);
                      return (
                        <div
                          key={`tab-${filter.type}-${filter.value}`}
                          className={cn(
                            "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer",
                            isSelected ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleFilter(filter)}
                        >
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span>{filter.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum nível disponível.
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="trainer" className="mt-0">
                <ScrollArea className="h-60 px-2 py-1">
                  {availableFilters.trainer.length > 0 ? (
                    availableFilters.trainer.map((filter) => {
                      const isSelected = isFilterActive(filter.type, filter.value);
                      return (
                        <div
                          key={`tab-${filter.type}-${filter.value}`}
                          className={cn(
                            "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer",
                            isSelected ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleFilter(filter)}
                        >
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span>{filter.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum treinador disponível.
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-y-2">
        {/* Distance Category */}
        <div className="flex items-center gap-1 border border-border/60 rounded-lg p-1 bg-muted/20 hover:bg-muted/30 transition-colors mr-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground px-2">Distância:</span>
          <div className="flex gap-1 flex-wrap">
            {QUICK_FILTERS.filter(f => f.type === 'distance').map((filter) => {
              const isActive = isFilterActive(filter.type, filter.value);
              return (
                <Badge
                  key={`quick-${filter.type}-${filter.value}`}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors text-xs h-6 px-2",
                    isActive 
                      ? "hover:bg-primary/80 bg-primary text-primary-foreground" 
                      : "hover:bg-muted dark:hover:bg-muted/70 bg-background"
                  )}
                  onClick={() => toggleFilter(filter)}
                >
                  {filter.label}
                </Badge>
              );
            })}
          </div>
        </div>
        
        {/* Level Category */}
        <div className="hidden md:flex md:items-center md:gap-1 border border-border/60 rounded-lg p-1 bg-muted/20 hover:bg-muted/30 transition-colors mb-2">
          <span className="text-xs font-medium text-muted-foreground px-2">Nível:</span>
          <div className="flex gap-1 flex-wrap">
            {QUICK_FILTERS.filter(f => f.type === 'level').map((filter) => {
              const isActive = isFilterActive(filter.type, filter.value);
              return (
                <Badge
                  key={`quick-${filter.type}-${filter.value}`}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors text-xs h-6 px-2",
                    isActive ? "text-white" : "",
                    getLevelBadgeStyles(filter.value, isActive)
                  )}
                  onClick={() => toggleFilter(filter)}
                >
                  {filter.label}
                </Badge>
              );
            })}
          </div>
        </div>
        
        {/* Active Filters Section */}
        {activeFilters.filter(([key]) => !['level', 'distance'].includes(key)).length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters
              .filter(([key]) => !['level', 'distance'].includes(key))
              .map(([key, value]) => (
                <Badge
                  key={`active-${key}-${value}`}
                  variant="secondary"
                  className="flex items-center gap-1 h-6 px-2 text-xs bg-secondary/50 mb-2"
                >
                  <span className="font-medium">{FILTER_LABELS[key]}:</span>
                  <span>{formatFilterValue(key, value)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3.5 w-3.5 p-0 ml-1 rounded-full hover:bg-background/80"
                    onClick={() => onFilterChange(
                      key as keyof Filters,
                      key === 'volume' || key === 'duration' ? 'qualquer' : 'todos'
                    )}
                  >
                    <X className="h-2.5 w-2.5" />
                    <span className="sr-only">Remover filtro</span>
                  </Button>
                </Badge>
              ))
            }
          </div>
        )}
        
        {/* Clear All Button */}
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1 border-1 bg-secondary/50 mb-2 h-8.5 px-2 text-xs text-muted-foreground hover:text-foreground ml-2"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ASSIGNMENT_STATUS_LABELS, STATUS_BADGE, TEAM_LABELS, TEAM_ORDER } from '@/lib/ministry';
import { MoreVertical, Pencil } from 'lucide-react';

export default function RosterList({
  assignments = [],
  conflicts = {},
  onEdit,
  onStatus,
  onSwap,
  onDelete,
}) {
  const groups = TEAM_ORDER.map((team) => ({
    team,
    rows: assignments.filter((a) => a.team === team),
  })).filter((group) => group.rows.length);

  if (!groups.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nobody is on this service yet. Add volunteers from your team list.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.team}>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {TEAM_LABELS[group.team]}
          </p>
          <div className="mt-2 space-y-2">
            {group.rows.map((row) => {
              const rowIssues = conflicts[row.id] || [];
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.member_name}</p>
                    {row.position && (
                      <p className="text-sm text-muted-foreground">{row.position}</p>
                    )}
                    {rowIssues.map((issue, index) => (
                      <p key={index} className="mt-1 text-xs text-amber-700">
                        {issue.message}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={STATUS_BADGE[row.status]}>
                      {ASSIGNMENT_STATUS_LABELS[row.status] || row.status}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(row)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" title="More actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatus(row, 'confirmed')}>
                          Mark confirmed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatus(row, 'declined')}>
                          Mark declined
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSwap(row)}>
                          Request a swap
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row)}>
                          Remove from service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
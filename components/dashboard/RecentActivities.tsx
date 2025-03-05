import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const RecentActivities: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
        <CardDescription>
          Seus treinos mais recentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Em uma versão futura, isso será preenchido com dados reais */}
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Seus treinos recentes aparecerão aqui quando você começar a treinar.
            </p>
            <Button variant="link" asChild>
              <Link href="/dashboard/log">
                Registrar treino manual
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
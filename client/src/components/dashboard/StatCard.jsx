import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

function StatCard({ title, value, description, icon: Icon, iconColor = 'text-primary', trend }) {
  return (
    <Card className="card-hover overflow-hidden relative">
      {/* Subtle gradient accent */}
      <div className={`absolute top-0 left-0 w-full h-1 ${
        iconColor === 'text-blue-500' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
        iconColor === 'text-green-500' ? 'bg-gradient-to-r from-green-400 to-green-600' :
        iconColor === 'text-purple-500' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
        iconColor === 'text-orange-500' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
        'bg-gradient-to-r from-primary to-primary/80'
      }`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg bg-opacity-10 ${
            iconColor === 'text-blue-500' ? 'bg-blue-500/10' :
            iconColor === 'text-green-500' ? 'bg-green-500/10' :
            iconColor === 'text-purple-500' ? 'bg-purple-500/10' :
            iconColor === 'text-orange-500' ? 'bg-orange-500/10' :
            'bg-primary/10'
          }`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value ?? 0}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export { StatCard };

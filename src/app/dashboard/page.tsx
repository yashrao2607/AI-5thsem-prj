import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MessageCircle, FileText, Bell, Settings, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dashboardItems = [
  {
    title: 'AI Chat',
    description: 'Engage with our intelligent AI assistant.',
    icon: MessageCircle,
    href: '/dashboard/chat',
    color: 'text-primary',
  },
  {
    title: 'Reports',
    description: 'Upload and analyze your health reports.',
    icon: FileText,
    href: '/dashboard/reports',
    color: 'text-accent',
  },
  {
    title: 'Reminders',
    description: 'Set and manage medication reminders.',
    icon: Bell,
    href: '/dashboard/reminders',
    color: 'text-yellow-500',
  },
  {
    title: 'Settings',
    description: 'Manage your account and preferences.',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'text-green-500',
  },
];

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Welcome, User!</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {dashboardItems.map((item) => (
          <Link href={item.href} key={item.title}>
            <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
              <div className="flex items-center p-6 pt-0">
                <Button variant="ghost" className="p-0 h-auto text-primary">
                  Go to {item.title} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'For individuals just getting started.',
    features: [
      'Unlimited Quizzes',
      'Basic Performance Tracking',
      '5 AI Report Queries/day',
      'Access to All Subjects',
    ],
    isPopular: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    priceDescription: '/ month',
    description: 'For serious learners who want to excel.',
    features: [
      'Everything in Basic',
      'Advanced Performance Analytics',
      'Unlimited AI Report Queries',
      'Handwritten Exam Grading',
      'Priority Support',
    ],
    isPopular: true,
  },
  {
    name: 'Premium',
    price: '$19.99',
    priceDescription: '/ month',
    description: 'For power users and institutions.',
    features: [
      'Everything in Pro',
      'Adaptive Quiz Generation',
      'Team & Class Management',
      'Custom Branding',
      'Dedicated Account Manager',
    ],
    isPopular: false,
  },
];

export default function PlansPage() {
  return (
    <div className="flex flex-col">
      <Header title="Upgrade Your Plan" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Flexible Plans for Everyone</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Choose the plan that's right for your learning goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={cn('flex flex-col', plan.isPopular && 'border-primary border-2 shadow-lg')}>
               {plan.isPopular && (
                  <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold rounded-t-lg -mt-px">
                    Most Popular
                  </div>
                )}
              <CardHeader className="items-start">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceDescription && <span className="ml-1 text-muted-foreground">{plan.priceDescription}</span>}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className={cn('w-full', !plan.isPopular && 'bg-blue-600 hover:bg-blue-700')}>
                  {plan.price === 'Free' ? 'Current Plan' : 'Choose Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}


'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Coins, Gem, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free Plan',
    price: '₹0',
    priceDescription: '',
    description: 'Try everything, limited AI help.',
    features: [
      'Unlimited quiz generation',
      'Unlimited exam generation',
      'Access to all classes 7–11',
      'All question types available',
      'Full progress tracking',
      'Chapter & subject completion system',
      'Ads included',
      'AI Assistant access limited',
      '5000 AI coins for 1 day only',
      'Basic AI reports & tips',
    ],
    isPopular: false,
  },
  {
    name: 'Premium Plan',
    icon: Gem,
    price: '₹500',
    priceDescription: '/ month',
    description: 'The ultimate learning experience with unlimited AI.',
    features: [
      'Unlimited quiz generation (free)',
      'Unlimited exam generation (free)',
      'Access to Classes 7–11',
      'All subjects unlocked',
      'All question types',
      'Full progress & analytics',
      'Chapter-wise mastery system',
      'No ads',
      'Unlimited AI assistant access',
      'Unlimited Coins',
      'Handwritten Exam Grading',
      'Adaptive Quiz Generation',
    ],
    isPopular: true,
  },
  {
    name: 'Ultimate Plan',
    price: 'Coming Soon',
    priceDescription: '',
    description: 'The ultimate learning experience with unlimited AI.',
    features: [
      'Everything in Premium',
      'Unlimited AI Assistant access',
      'Unlimited Coins',
      'Handwritten Exam Grading',
      'Adaptive Quiz Generation',
    ],
    isPopular: false,
  },
];

export default function PlansPage() {
  return (
    <div className="flex flex-col">
      <Header title="Upgrade Your Plan" />
      <main className="flex-1 space-y-8 p-4 pt-6 md:p-8">
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
                <CardTitle className="text-2xl flex items-center gap-2">
                    {plan.icon && <plan.icon className="h-6 w-6 text-primary" />}
                    {plan.name}
                </CardTitle>
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
                  {plan.exclusions && plan.exclusions.map((exclusion) => (
                     <li key={exclusion} className="flex items-center gap-3">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-muted-foreground">{exclusion}</span>
                     </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className={cn('w-full', plan.isPopular && 'bg-primary hover:bg-primary/90')} disabled={plan.price === 'Coming Soon'}>
                  {plan.price === '₹0' ? 'Current Plan' : (plan.price === 'Coming Soon' ? 'Coming Soon' : 'Choose Plan')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto pt-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coins className="h-6 w-6 text-yellow-500" />
                        AI Coin Usage
                    </CardTitle>
                    <CardDescription>
                        Coins are used for premium AI features like getting detailed performance reports, improvement tips, and personalized study help from Nova.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="font-semibold">Free Plan</p>
                            <p className="text-sm text-muted-foreground">5,000 coins (1 day)</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="font-semibold">Premium Plan</p>
                            <p className="text-sm text-muted-foreground">Unlimited</p>
                        </div>
                         <div className="p-4 rounded-lg bg-muted">
                            <p className="font-semibold">Ultimate Plan</p>
                            <p className="text-sm text-muted-foreground">Unlimited</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

      </main>
    </div>
  );
}

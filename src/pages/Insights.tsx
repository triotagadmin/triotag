import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Insights = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Rise of Micro-Advertising: Why Smaller Spaces Create Bigger Impact",
      excerpt: "In an era of banner blindness and ad fatigue, micro-advertising is revolutionizing how brands connect with consumers. Discover why tiny ad placements in unexpected locations are outperforming traditional advertising channels.",
      author: "Sarah Chen",
      date: "March 15, 2025",
      readTime: "8 min read",
      category: "Industry Trends",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200",
      content: `
## The Attention Economy Crisis

Traditional advertising is facing an unprecedented challenge. With the average person exposed to 4,000-10,000 ads daily, consumer attention has become the scarcest resource in marketing. This phenomenon, known as "banner blindness," has rendered many conventional advertising methods ineffective.

## Enter Micro-Advertising

Micro-advertising represents a paradigm shift in how brands engage with consumers. Instead of competing for attention in oversaturated digital spaces, micro-ads leverage unconventional, intimate touchpoints where consumer guard is naturally lower.

### Key Statistics:

- **84% higher engagement** rates compared to traditional digital ads
- **3x better recall** in consumer surveys
- **65% lower cost** per impression
- **92% of consumers** find micro-ads less intrusive

## Why Micro-Ads Work

### 1. Context is King
Micro-ads appear in contextually relevant environments. A coffee brand ad inside a café bathroom reaches consumers exactly when they're thinking about their next cup.

### 2. Novelty Factor
The unexpected nature of these placements creates memorable brand moments. Consumers actively engage with ads that surprise them in their daily routines.

### 3. Lower Resistance
Without the clutter of competing messages, micro-ads face minimal psychological resistance. The single-message environment allows for deeper processing.

### 4. Authentic Integration
These ads feel like natural parts of the environment rather than interruptions, creating positive brand associations.

## Real-World Success Stories

**Case Study: Local Coffee Roaster**
A small coffee brand placed ads in metro station bathrooms across the city. Result: 340% increase in website visits and 28% boost in local store traffic within 30 days.

**Case Study: Fitness App**
Gym mirror ads generated 5x more app downloads than social media campaigns at 1/10th the cost.

## The Future is Tiny

As advertising costs rise and digital spaces become more saturated, smart brands are discovering that thinking smaller leads to bigger results. Micro-advertising isn't just a trend—it's the future of effective marketing in an attention-starved world.

The question isn't whether to embrace micro-advertising, but how quickly your brand can adapt to this powerful new channel.
      `
    },
    {
      id: 2,
      title: "Guerrilla Marketing Meets Technology: The Agent Publisher Revolution",
      excerpt: "Influencers, models, and street teams are becoming the new face of advertising. Learn how agent-based micro-advertising is creating authentic brand experiences that traditional campaigns can't match.",
      author: "Marcus Rodriguez",
      date: "March 12, 2025",
      readTime: "6 min read",
      category: "Marketing Strategy",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1200",
      content: `
## The Human Touch in Digital Age

While technology dominates modern marketing, a counterintuitive trend is emerging: human-powered, agent-based advertising is outperforming purely digital campaigns. This fusion of guerrilla marketing tactics with modern technology platforms is creating unprecedented ROI for brands.

## What Are Agent Publishers?

Agent publishers are individuals who monetize their presence, creativity, and social capital through micro-advertising placements. They include:

- **Guerrilla Agents**: Street teams executing creative campaigns in high-traffic areas
- **Influencers**: Social media personalities with engaged niche audiences
- **Models**: Brand ambassadors at events and public spaces
- **Artists**: Creative professionals integrating brands into their work

## The Platform Revolution

Modern agent publisher platforms have transformed guerrilla marketing from chaotic campaigns into data-driven, measurable strategies.

### Technology Enables:

1. **Real-time Campaign Tracking**: GPS verification and photo evidence ensure deliverables
2. **Micro-payments**: Instant compensation for completed placements
3. **Quality Control**: Rating systems maintain campaign standards
4. **Audience Analytics**: Detailed demographics and engagement metrics
5. **Scalability**: Deploy campaigns across hundreds of agents simultaneously

## Why Agents Outperform Traditional Channels

### Authenticity Factor
89% of consumers trust recommendations from real people over branded content. Agent publishers provide genuine, relatable brand advocacy.

### Contextual Relevance
Agents operate in relevant environments. A fitness influencer promoting workout gear at the gym creates natural product placement opportunities.

### Creative Flexibility
Unlike rigid traditional campaigns, agents adapt messaging to their audience and environment, creating more engaging experiences.

### Cost Efficiency
Agent campaigns typically cost 40-60% less than equivalent traditional advertising while delivering superior engagement rates.

## Case Studies

**Fashion Brand Launch**
Deployed 50 model agents at fashion district events. Results:
- 12,000 verified impressions
- 2,800 social media mentions
- 450% ROI in first month

**Energy Drink Campaign**
Guerrilla agents distributed samples at gyms, skate parks, and college campuses:
- 85% trial-to-purchase conversion
- 4.2x better than supermarket sampling
- Built loyal community of brand advocates

## Best Practices for Agent Campaigns

### 1. Clear Guidelines with Creative Freedom
Provide brand guardrails while allowing agents to adapt to their unique situations and audiences.

### 2. Technology Integration
Use platforms that offer verification, payment, and communication tools to streamline campaign management.

### 3. Relationship Building
Top-performing agents become long-term brand partners. Invest in these relationships.

### 4. Performance Metrics
Track engagement, reach, and conversion—not just impressions. Quality over quantity.

### 5. Compliance and Authenticity
Ensure proper disclosure and genuine endorsements. Authenticity is your competitive advantage.

## The Future of Agent Marketing

As consumers increasingly ignore traditional advertising, agent-based micro-campaigns represent the evolution of marketing. By combining human authenticity with technological efficiency, brands can create meaningful connections in an increasingly impersonal digital landscape.

The revolution isn't about replacing digital marketing—it's about augmenting it with the irreplaceable human element that drives real engagement and lasting brand loyalty.
      `
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge className="mb-4">Industry Insights</Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              Micro-Advertising Insights
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover trends, strategies, and success stories in the micro-advertising revolution
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.author}</span>
                    </div>
                    <Link to={`/insights/${post.id}`}>
                      <Button variant="ghost" size="sm">
                        Read More <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">More Insights Coming Soon</CardTitle>
                <CardDescription className="text-base">
                  Subscribe to our newsletter to get the latest micro-advertising trends, case studies, and strategies delivered to your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button>Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Insights;

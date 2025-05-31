import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, PlusCircle, ArrowRight, Smile, MessageCircle } from "lucide-react"; // Changed ThumbsUp to Smile
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const tribesData = [
  { id: "1", name: "AI Innovators", description: "Exploring the future of artificial intelligence and machine learning.", members: 128, isPublic: true, cover: "https://placehold.co/400x200.png?text=AI" , dataAiHint: "technology innovation" },
  { id: "2", name: "Weekend Hikers Club", description: "Sharing trails, tips, and breathtaking views from our adventures.", members: 76, isPublic: true, cover: "https://placehold.co/400x200.png?text=Hiking" , dataAiHint: "nature mountain" },
  { id: "3", name: "Indie Game Devs", description: "A community for indie game developers to collaborate and showcase.", members: 245, isPublic: false, cover: "https://placehold.co/400x200.png?text=Games" , dataAiHint: "gaming development" },
  { id: "4", name: "Local Bookworms", description: "Discussing our favorite reads and discovering new authors together.", members: 55, isPublic: true, cover: "https://placehold.co/400x200.png?text=Books" , dataAiHint: "reading library" },
  { id: "5", name: "Sustainable Living Hub", description: "Tips and discussions on eco-friendly practices and sustainability.", members: 92, isPublic: true, cover: "https://placehold.co/400x200.png?text=Eco" , dataAiHint: "nature environment" },
];

export default function TribesPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground font-mono">Your Tribes</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Manage your existing tribes or discover new ones to join.
          </p>
        </div>
        <Link href="/tribes/create" passHref>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Tribe
          </Button>
        </Link>
      </header>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search for tribes..." className="pl-10 py-3 text-base rounded-full shadow-sm" />
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">My Tribes</h2>
        {tribesData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tribesData.filter(t => t.members > 100).slice(0,3).map((tribe) => ( // Example filter for "My Tribes"
              <Card key={tribe.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col overflow-hidden">
                <div className="relative h-40 w-full">
                  <Image src={tribe.cover} alt={tribe.name} layout="fill" objectFit="cover" data-ai-hint={tribe.dataAiHint} />
                   <Badge variant={tribe.isPublic ? "secondary" : "destructive"} className="absolute top-2 right-2">
                    {tribe.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold truncate">{tribe.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pb-2">
                  <CardDescription className="text-sm h-16 overflow-hidden text-ellipsis leading-relaxed">{tribe.description}</CardDescription>
                  <div className="flex items-center text-xs text-muted-foreground mt-2 space-x-3">
                    <div className="flex items-center"><Users className="h-3.5 w-3.5 mr-1"/> {tribe.members} members</div>
                    <div className="flex items-center"><Smile className="h-3.5 w-3.5 mr-1"/> 1.2k Good Vibes</div>
                    <div className="flex items-center"><MessageCircle className="h-3.5 w-3.5 mr-1"/> 300 Posts</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/tribes/${tribe.id}`} passHref className="w-full">
                    <Button variant="default" className="w-full bg-primary hover:bg-primary/90">
                      View Tribe <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Tribes Yet</CardTitle>
            <CardDescription className="mt-2 mb-4">You haven't joined or created any tribes. Start by creating one or exploring existing communities.</CardDescription>
            <Link href="/tribes/create" passHref>
              <Button variant="default">Create Your First Tribe</Button>
            </Link>
          </Card>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Discover Tribes</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tribesData.filter(t => t.members <= 100).slice(0,3).map((tribe) => ( // Example filter for "Discover Tribes"
              <Card key={tribe.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col overflow-hidden">
                <div className="relative h-40 w-full">
                  <Image src={tribe.cover} alt={tribe.name} layout="fill" objectFit="cover" data-ai-hint={tribe.dataAiHint} />
                   <Badge variant={tribe.isPublic ? "secondary" : "destructive"} className="absolute top-2 right-2">
                    {tribe.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold truncate">{tribe.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pb-2">
                  <CardDescription className="text-sm h-16 overflow-hidden text-ellipsis leading-relaxed">{tribe.description}</CardDescription>
                   <div className="flex items-center text-xs text-muted-foreground mt-2 space-x-3">
                    <div className="flex items-center"><Users className="h-3.5 w-3.5 mr-1"/> {tribe.members} members</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                      Join Tribe
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="link" className="text-primary text-lg">Load More Tribes <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
      </section>
    </div>
  );
}

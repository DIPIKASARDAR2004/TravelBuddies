 import Image from "next/image";
import logo from "public/logo.png";
export default function Contact() {
  return (
    <>
      <head>
        <title>About</title>
      </head>
      <main className="oo"style={{ fontFamily: 'Segoe UI, sans-serif', background: 'linear-gradient(135deg, #bebfbfff 0%, #fffde4 100%)', minHeight: '100vh', padding: '2rem' }}>
       
        <section className="abo"style={{ maxWidth: 1200, margin: '8%', background: '#ffffffff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.2rem '}}>
            <Image src="/imag.png" alt="Wanderlust Globe" width={140} height={160} />
            <h1 style={{ fontSize: '3.1rem', fontWeight: 700, color: '#4689a4ff', margin: 5 }}>About Travel Buddies</h1>
          </div>
          <p className="pp"style={{ fontSize: '1.2rem', color: '#646464ff', marginBottom: '1.5rem' ,fontFamily:'sans-serif'}}>
           <h4 style={{color:"#3969a3ff"}}> Who We Are</h4>
Travel Buddies is a community-driven travel platform created for passionate explorers who believe that the best adventures are shared. 
Whether you're planning a solo journey or looking for companions to explore new destinations, 
Travel Buddies connects you with like-minded travelers around the world.Our mission is to make travel more meaningful, accessible, and social. We aim to bridge the gap between travelers through shared experiences, 
helpful insights, and real connections. 
At Travel Buddies, you're never traveling alone — you're part of a global family of explorers.
          </p>


          <ul className="hi" style={{ fontSize: '1.1rem', color: '#3f4658ff', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
                    
            
            <li> <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.1rem '}}>
            
             <p>
            Destination Guides: Explore in-depth guides, local tips, and curated itineraries.
              </p>
                </div></li>
 <li><div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '0.1rem '}}>
            <p>Travel Stories & Blogs: Read real stories from our community to get inspired.</p></div></li>
            <li> <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '0.1rem '}}>
            <p>Travel Planning Tools: Simplify your journey with checklists, planners.

 Our Values.</p></div></li>
            <li><div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '0.1rem '}}>
            <p> Travel Partners: Connect with fellow travelers heading to the same destination.</p></div></li>
             
    

          </ul>
          <div style={{ marginBottom: '2rem' }}>
           </div>
        </section>
      </main>
    </>
  );
}

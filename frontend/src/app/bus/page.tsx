 "use client";

import TransportSearchForm from "@/components/transport/TransportSearchForm";
import TransportFooter from "@/components/transport/TransportFooter";

export default function Bus() {
  return (
    <main className="page">
      <TransportSearchForm title="Book Bus Tickets" logoSrc="/blo.png" />

      {/*this is train part for photos*/}
      <div className="offer-container">
        <div className="offer-card">
          <img src="b1.png" alt="h" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Mercedes-Benz Multi-Axle Coaches</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/b2.png" alt="flight" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Scania Metrolink</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/b3.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Tata Marcopolo & Tata Globus</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
        
        <div className="offer-card">
          <img src="/b4.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Eicher Skyline Pro</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
        
        <div className="offer-card">
          <img src="/b5.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">BharatBenz 2441</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
        
        <div className="offer-card">
          <img src="/b6.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Hyundai Universe</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
        
        <div className="offer-card">
          <img src="/b7.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">KSRTC Airavat Club Class (Volvo)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
        
        <div className="offer-card">
          <img src="/b8.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Orange Sleeper & VRL Volvo Coaches</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
      </div>
      
      <TransportFooter />
    </main>
  );
}

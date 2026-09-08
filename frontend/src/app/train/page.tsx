/* eslint-disable react/no-unescaped-entities */
"use client";

import TransportSearchForm from "@/components/transport/TransportSearchForm";
import TransportFooter from "@/components/transport/TransportFooter";

export default function Train() {
  return (
    <main className="page">
      <TransportSearchForm title="Book Train Tickets" logoSrc="/d2.png" />

      {/* this is train part for photos */}
      <div className="offer-container">
        <div className="offer-card">
          <img src="/t1.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi to Goa. The Goa Express (12779/12780)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t2.jpg" alt="flight" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi and Mumbai. The Mumbai Rajdhani Express (12951/12952)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t3.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi and Pune. the Jhelum Express (11078)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t4.jpg" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi to Hyderabad. Telangana Express (12724)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t5.jpg" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi and West Bengal. the Kolkata Rajdhani (12306)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t6.jpg" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi and Chennai (formerly Madras). The Tamil Nadu Express (12622)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t7.jpg" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi and Madhya Pradesh. The Bhopal Shatabdi (12002)</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>

        <div className="offer-card">
          <img src="/t8.png" alt="holiday" className="offer-img" />
          <div className="offer-content">
            <p className="offer-type">Special offer</p>
            <h4 className="offer-title">Delhi to Pondicherry is the NDLS PDY SF EXP (22404),</h4>
            <p className="offer-desc">Book your trip long weekend trip now.</p>
          </div>
        </div>
      </div>
      
      <TransportFooter />
    </main>
  );
}
 "use client";
import { useState } from "react";
import Link from "next/link";


export default function Bus() {
  const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState("");
    const [travelClass, setTravelClass] = useState("All");
  
    const swap = () => {
      const a = from;
      setFrom(to);
      setTo(a);
    };
  
    const handleSearch = (e) => {
      e.preventDefault();
      alert(`Searching…
  From: ${from}
  To: ${to}
  Date: ${date}
  Class: ${travelClass}`);
    };
  
  return (
    <main className="page">
          
           <div className="name">
           <div className="h1">
            <img src="/blo.png"className="h6_img"/>
           <h6 className="h6">Book   bus   Tickets</h6>
           </div>
    
           <form className="searchCard" onSubmit={handleSearch}>
              <div className="nam2">
              <div className="row">
                <div className="field">
                <label className="label">From</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Kolkata"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
    
              <button
                type="button"
                className="swap"
                aria-label="Swap From and To"
                onClick={swap}
                title="Swap"
              >
                ⇄
              </button>
    
              <div className="field">
                <label className="label">To</label>
                <input
                  className="input"
                  type="text"
                  placeholder="mumbai"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
    
              <div className="field narrow">
                <label className="label">Date</label>
                <input
                  className="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
    
              <div className="field narrow">
                <label className="label">Class</label>
                <select
                  className="select"
                  value={travelClass}
                  onChange={(e) => setTravelClass(e.target.value)}
                >
                  <option>All</option>
                  <option>AC</option>
                  <option>Non-AC</option>
                  <option>Sleeper</option>
                </select>
              </div>
            </div>
           < div className="fare-section">
              <p>Select a special fare</p>
              <label className="f1"> <input type="radio" name="fare"/> Regular</label>
              <label className="f1"><input type="radio" name="fare"/> Student</label>
              <label className="f1"><input type="radio" name="fare"/> Senior Citizen</label>
             {/* <label className="f1"><input type="radio" name="fare"/> Doctor & Nurses</label>
              <label className="f1"><input type="radio" name="fare"/> Army</label>*/}
            </div>
            <div className="checkbox-conta">
              <label>
                <input type="checkbox" value="che"/>
                Add FlexiFly 100% refund on cancellation or Zero date change charges
                <a href="https://www.bing.com/search?pglt=297&q=train+policy&cvid=abda7b0dc35c4f14a5920fc875b89349&gs_lcrp=EgRlZGdlKgYIABBFGDkyBggAEEUYOTIGCAEQABhAMgYIAhAAGEAyBggDEAAYQDIGCAQQABhAMgYIBRAAGEAyBggGEAAYQDIGCAcQABhAMgYICBAAGEDSAQg2ODEzajBqMagCCLACAQ&FORM=ANNTA1&PC=HCTS.com"className="view">View Details</a>
              </label>
            </div>
            <div className="btn-container">
            <button className="btnPrimary" type="submit">Search</button>
            </div>
            </div>
           </form>
    
           {/*this is train part for photos*/}
          
          <div className="offer-container">
      <div className="offer-card">
        <img src="b1.png" alt="h" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">Mercedes-Benz Multi-Axle Coaches 
</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
    
      <div className="offer-card">
        <img src="/b2.png" alt="flight" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">Scania Metrolink </h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
    
      <div className="offer-card">
        <img src="/b3.png" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title"> ata Marcopolo & Tata Globus
</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
        <div className="offer-card">
        <img src="/b4.png" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">Eicher Skyline Pro
</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
        <div className="offer-card">
        <img src="/b5.png" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title"> BharatBenz 2441</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
        <div className="offer-card">
        <img src="/b6.png" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">Hyundai Universe </h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
      <div className="offer-card">
        <img src="/b7.png" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title"> KSRTC Airavat Club Class (Volvo)</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
      <div className="offer-card">
        <img src="/b8.png" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title"> Orange Sleeper & VRL Volvo Coaches </h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
    
    </div>
          
            <footer className="footer">
              <div>
              <h4>
                Make Your Bus Booking Smoother With Travel Buddies
              </h4>
              <p>
                Imagine the thrill of feeling the wind in your hair, 
                while looking at the changing scenes from a window-seat, in a bus. Makes you smile, doesn't it? 
                Bus journeys are always filled with such memorable and fun moments, which we look back at, fondly.
                 And in our continuous endeavour to bring to our customers the best travel experiences, 
                 we now offer smarter bus booking. services on our platform.
                 Read on to know why you should make your upcoming bus ticket bookings, online on Travel Buddies.
              </p>
              </div>
    
              <div>
              <h4>
               Advantages of booking bus tickets online on Travel Buddies
              </h4>
              <p>
                The most important part of any trip is planning because if you plan well, 
                you are sure to enjoy your trip better. And online bus bookings allow you just that. 
                You can check for bus routes to your destination, compare prices with other nearby routes,
                 choose from AC/non-AC buses as per your preference and more,
                  all within a few minutes and with just a few taps on your phone.
                   You can also avail of immediate cancellation in case of a sudden change in plans,
                    within a few seconds, and without the hass...
              </p>
              </div>
              <div>
              <h4>
                How to Book Bus Online on Travel Buddies:
              </h4>
              <p>
                Booking bus tickets online is super easy and comfortable.
                 All you have to do is follow the steps below: 
                 Tap on the Trains & Bus' icon on the Travel Buddies homepage
              </p>
              </div>
              <div>
              <h4>
                Why Travel Buddiesfor Bus Booking?
              </h4>
              <p>
                The leading player in online Bus bookings in India, 
                Travel Buddies offers lowest fares, 
                exclusive discounts and a scamless online booking experience.
                 Desktop or mobile site is a delightfully. customer friendly experience,
                  and with just a few clicks you can complete your booking
              </p>
              </div>
              <div>
              <h4>
                Reasons to Choose Travel Buddies for Bus Booking:
              </h4>
              <p>
                MySafety Assurance: All the buses available on our platform are MySafety-assured with regular 
                sanitization of the vehicle carried out after every trip, regular temperature checks done on passengers before boarding the bus, and the staff following all safety protocols.
    
    Customer First Policy: When you complete your online bus booking on Travel Buddies, 
    be sure of getting the highest standards of customer service, including regular trip-related updates on your device. Competitiv...
    
              </p>
              </div>
              <div>
              <h4>
               What's more?
    
              </h4>
              <p>
                Online bus ticket booking also gives you the freedom to choose your mode of payment. 
                No more do you have to carry cash or pay for your tickets in cash. 
                You can avail a variety of payment modes when you choose to book bus online on Travel Buddies. Here below is a list of the payment modes available on our platform: Debit Card.
                 Credit Card & Net Banking with banks like: HDFC Bank, ICICI Bank, Axis Bank, State Bank of India and many more, UPI mode of payment, Trip Money, Wallet & more, Google Pay, Pho...
    
              </p>
              </div>
              <div>
              <h4>
               MySafety Assurance on Bus Bookings:
    
    
              </h4>
              <p>
                All the buses available on our platform follow stringent safety protocols 
                and government-mandated social distancing guidelines, with the primary focus on customer safety.
                 All customers have to undergo temperature checks mandatorily before boarding the bus All the buses come with hand sanitisers.
                  All the staff wear masks and gloves to minimize direct contact The vehicle is thoroughly disinfected after the completion of every bus ride.
    
    Seats are allocated, keeping the social dist...
    
              </p>
              </div>
    <div>
              <h4>
               Booking Bus Ticket with Travel Buddies.
    
    
              </h4>
              <p>
                With more than 12,000 bus routes spread across India and integration with over 1300 bus operators,
                 Travel Buddies online bus reservation system is simpler and smarter. It provides you a wide range of facilities,
                  right from choosing your pickup point to your preferred choice of seat (for instance, luxury buses with sleeper berths). 
                 You can also choose from the widest range of available buses like Mercedes. Volvo Volvo AC,
                 AC luxury, Deluxe Sleeper, Express and other private buses. The payment opt...
              </p>
              </div>
    
            </footer>
    
    
    
           </div>
        </main>
  );
}

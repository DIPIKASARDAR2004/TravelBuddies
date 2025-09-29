 "use client";
import { useState } from "react";
import Link from "next/link";


export default function HotelBookingForm() {
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [price, setPrice] = useState("0-1500");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching Hotels...
City: ${city}
Check-In: ${checkIn}
Check-Out: ${checkOut}
Rooms: ${rooms}, Guests: ${guests}
Price: ${price}`);
  };

  
  return (
    <main className="hotel-page">
          
           <div className="h_name">
           <div className="hotel_c">
            <img src="/d2.png"className="h_img"/>
           <h6 className="hotel_tittle">Book   Hotels</h6>
           </div>
    
         
          <form className="hotel-card" onSubmit={handleSearch}>
        <div className="name3">
          <div className="row3">
        <div className="hotel-field">
          <label className="hotel-label">City / Location</label>
          <input
            className="hotel-input"
            type="text"
            placeholder="Enter city (e.g., Goa)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
         {/* Check-In */}
        <div className="hotel-field">
          <label className="hotel-label">Check-In</label>
          <input
            className="hotel-input"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
         {/* Check-Out */}
        <div className="hotel-field">
          <label className="hotel-label">Check-Out</label>
          <input
            className="hotel-input"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
        {/* Rooms & Guests */}
        <div className="hotel-field">
          <label className="hotel-label">Rooms & Guests</label>
          <div className="hotel-inline">
            <input
              type="number"
              min="1"
              value={rooms}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRooms(Number(e.target.value))}
              className="hotel-input small"
            />{" "}
            Rooms
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuests(Number(e.target.value))}
              className="hotel-input small"
            />{" "}
            Guests
          </div>
        </div>
                {/* Price Per Night */}
        <div className="hotel-field">
          <label className="hotel-label">Price Per Night</label>
          <select
            className="hotel-select"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          >
            <option value="0-1500">₹0 - ₹1500</option>
            <option value="1500-2500">₹1500 - ₹2500</option>
            <option value="2500-5000">₹2500 - ₹5000</option>
            <option value="5000+">₹5000+</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="hotel-btn-container">
          <button className="hotel-btn" type="submit">
            Search
          </button>
        </div>
            </div>
            </div>
           </form>
    
           {/*this is train part for photos*/}
          
          <div className="offer-container">
      <div className="offer-card">
        <img src="h1.png" alt="h" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">The Leela Palace Udaipur
</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
    
      <div className="offer-card">
        <img src="/h2.jpg" alt="flight" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">The Oberoi Udaivilas, Udaipur</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
    
      <div className="offer-card">
        <img src="/h3.jpg" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title"> ITC Grand Chola, Chennai
</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
        <div className="offer-card">
        <img src="/h4.jpg" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">The Lodhi, New Delhi
</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
        <div className="offer-card">
        <img src="/h5.jpg" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">Umaid Bhawan Palace, Jodhpur</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
        <div className="offer-card">
        <img src="/h6.jpg" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">Taj Lake Palace, Udaipur</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
      <div className="offer-card">
        <img src="/h7.jpg" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title"> Raj Palace, Jaipur</h4>
          <p className="offer-desc">Book your trip long weekend trip now.</p>
        </div>
      </div>
      <div className="offer-card">
        <img src="/h8.jpg" alt="holiday" className="offer-img" />
        <div className="offer-content">
          <p className="offer-type">Special offer</p>
          <h4 className="offer-title">The Oberoi Grand, Kolkata </h4>
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
                 AC luxury, Deluxe Sleeper, Express and other private buses. The payment opt...
              </p>
              </div>
    
            </footer>
    
    
    
           </div>
        </main>
  );
}
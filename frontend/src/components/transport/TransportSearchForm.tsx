import React, { useState } from 'react';

interface TransportSearchFormProps {
  title: string;
  logoSrc: string;
}

export default function TransportSearchForm({ title, logoSrc }: TransportSearchFormProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [travelClass, setTravelClass] = useState("All");

  const swap = () => {
    const a = from;
    setFrom(to);
    setTo(a);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching…\nFrom: ${from}\nTo: ${to}\nDate: ${date}\nClass: ${travelClass}`);
  };

  return (
    <div className="name">
      <div className="h1">
        <img src={logoSrc} className="h6_img" alt="logo" />
        <h6 className="h6">{title}</h6>
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
                placeholder="Mumbai/Delhi"
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
          <div className="fare-section">
            <p>Select a special fare</p>
            <label className="f1"> <input type="radio" name="fare" /> Regular</label>
            <label className="f1"><input type="radio" name="fare" /> Student</label>
            <label className="f1"><input type="radio" name="fare" /> Senior Citizen</label>
            <label className="f1"><input type="radio" name="fare" /> Doctor & Nurses</label>
            <label className="f1"><input type="radio" name="fare" /> Army</label>
          </div>
          <div className="checkbox-conta">
            <label>
              <input type="checkbox" value="che" />
              Add FlexiFly 100% refund on cancellation or Zero date change charges
              <a href="https://www.bing.com/search?q=train+policy" className="view">View Details</a>
            </label>
          </div>
          <div className="btn-container">
            <button className="btnPrimary" type="submit">Search</button>
          </div>
        </div>
      </form>
    </div>
  );
}

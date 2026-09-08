-- --------------------------------------------------------
-- HOTELS (12 records: 6 for Darjeeling, 6 for Jaipur)
-- --------------------------------------------------------
INSERT INTO "Hotels" (destination, hotel_name, price_per_night, rating, is_women_friendly) VALUES
-- Darjeeling
('Darjeeling', 'Backpacker''s Haven', 800.00, 4.8, true),           -- 1. Cheap + highly rated
('Darjeeling', 'Misty Mountain Inn', 900.00, 3.4, false),          -- 2. Cheap + average rated
('Darjeeling', 'Pine Crest Boutique', 2500.00, 4.2, true),         -- 3. Mid-range + good rated
('Darjeeling', 'Heritage Grand View', 5000.00, 3.2, false),        -- 4. Expensive + average/low rated
('Darjeeling', 'Windamere Retreat', 7000.00, 4.7, true),           -- 5. Premium + highly rated
('Darjeeling', 'The Himalayan Crown', 12000.00, 4.9, true),        -- 6. Luxury + excellent rated
-- Jaipur
('Jaipur', 'Pink City Hostel', 600.00, 4.7, true),                 -- 1. Cheap + highly rated
('Jaipur', 'Desert Guest House', 700.00, 3.1, false),              -- 2. Cheap + average rated
('Jaipur', 'Rajputana Haveli', 3000.00, 4.4, true),                -- 3. Mid-range + good rated
('Jaipur', 'Royal Palace View', 6000.00, 3.3, false),              -- 4. Expensive + average/low rated
('Jaipur', 'The Heritage Fort', 8500.00, 4.8, true),               -- 5. Premium + highly rated
('Jaipur', 'Maharaja Grand Taj', 18000.00, 5.0, true);             -- 6. Luxury + excellent rated


-- --------------------------------------------------------
-- RESTAURANTS (10 records: 5 for Darjeeling, 5 for Jaipur)
-- --------------------------------------------------------
INSERT INTO restaurants (destination, restaurant_name, cost_per_meal, rating) VALUES
-- Darjeeling
('Darjeeling', 'Mountain Mist Snack Bar', 150.00, 4.6),            -- Cheap local food
('Darjeeling', 'The Happy Yak Noodle House', 300.00, 4.1),         -- Budget restaurant
('Darjeeling', 'Pine Valley Bakery & Cafe', 800.00, 4.5),          -- Mid-range restaurant
('Darjeeling', 'Himalayan Zenith Dining', 1500.00, 4.7),           -- Premium restaurant
('Darjeeling', 'The Colonial Tea Room', 2500.00, 3.5),             -- Expensive + average rating
-- Jaipur
('Jaipur', 'Desert Sweets & Snacks', 100.00, 4.5),                 -- Cheap local food
('Jaipur', 'Spicy Camel Diner', 350.00, 4.2),                      -- Budget restaurant
('Jaipur', 'The Sapphire Rooftop Restaurant', 900.00, 4.6),        -- Mid-range restaurant
('Jaipur', 'The Rajput Era Dining', 2000.00, 4.8),                 -- Premium restaurant
('Jaipur', 'Golden Palace Feast', 3500.00, 3.6);                   -- Expensive + average rating


-- --------------------------------------------------------
-- ACTIVITIES (8 records: 4 for Darjeeling, 4 for Jaipur)
-- --------------------------------------------------------
INSERT INTO activities (destination, activity_name, cost_per_person) VALUES
-- Darjeeling
('Darjeeling', 'Mall Road Stroll', 0.00),                          -- Free
('Darjeeling', 'Batasia Loop Entry', 50.00),                       -- Low-cost
('Darjeeling', 'Himalayan Mountaineering Institute Visit', 200.00),-- Mid-range
('Darjeeling', 'Private Tiger Hill Sunrise Tour', 1500.00),        -- Premium
-- Jaipur
('Jaipur', 'Hawa Mahal Outside View & Market Walk', 0.00),         -- Free
('Jaipur', 'Albert Hall Museum Entry', 40.00),                     -- Low-cost
('Jaipur', 'Amer Fort Guided Tour', 500.00),                       -- Mid-range
('Jaipur', 'Hot Air Balloon Safari', 4000.00);                     -- Premium


-- --------------------------------------------------------
-- TRANSPORT (6 records: 3 for Darjeeling, 3 for Jaipur)
-- --------------------------------------------------------
INSERT INTO transport (destination, transport_mode, cost_per_person) VALUES
-- Darjeeling
('Darjeeling', 'Shared Jeep (Per Seat)', 50.00),                   -- Budget local
('Darjeeling', 'Auto Rickshaw (Per Passenger Fare)', 200.00),      -- Standard local
('Darjeeling', 'Premium Tourist Shuttle (Per Seat)', 1200.00),     -- Premium private
-- Jaipur
('Jaipur', 'E-Rickshaw (Shared Seat)', 40.00),                     -- Budget local
('Jaipur', 'City Cab (Per Person Rate)', 300.00),                  -- Standard local
('Jaipur', 'Luxury Coach (Guided Tour Seat)', 2500.00);            -- Premium private

-- Create Activities table
CREATE TABLE Activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    destination TEXT,
    activity_name TEXT,
    cost_per_person NUMERIC
);

-- Create Transport table
CREATE TABLE Transport (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    destination TEXT,
    transport_mode TEXT,
    cost_per_person NUMERIC
);

-- Insert sample data for Activities in Digha
INSERT INTO Activities (destination, activity_name, cost_per_person) VALUES
('Digha', 'Beach Walk and Sunrise Watching', 0.00), -- Free activity
('Digha', 'Marine Aquarium and Regional Centre Visit', 50.00),
('Digha', 'Parasailing at New Digha Beach', 1000.00);

-- Insert sample data for Transport to Digha
INSERT INTO Transport (destination, transport_mode, cost_per_person) VALUES
('Digha', 'Local Bus', 150.00),
('Digha', 'Train (Tamralipta Express)', 250.00),
('Digha', 'Private AC Car (Shared)', 800.00);

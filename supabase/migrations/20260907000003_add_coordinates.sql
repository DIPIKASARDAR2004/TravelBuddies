-- Add latitude and longitude to Hotels
ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add latitude and longitude to Activities (handle both cases if table is named activities or Activities)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Activities') THEN
        ALTER TABLE "Activities" ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE "Activities" ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
        ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    END IF;
END $$;

-- Update Darjeeling Hotels
UPDATE "Hotels" SET latitude = 27.0370, longitude = 88.2610 WHERE hotel_name = 'Hill View Residency' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0420, longitude = 88.2650 WHERE hotel_name = 'Cedar Grove Inn' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0390, longitude = 88.2630 WHERE hotel_name = 'Summit Valley Hotel' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0450, longitude = 88.2680 WHERE hotel_name = 'Alpine Heights Retreat' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0400, longitude = 88.2600 WHERE hotel_name = 'Backpacker''s Haven' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0410, longitude = 88.2610 WHERE hotel_name = 'Misty Mountain Inn' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0440, longitude = 88.2630 WHERE hotel_name = 'Pine Crest Boutique' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0460, longitude = 88.2660 WHERE hotel_name = 'Heritage Grand View' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0450, longitude = 88.2670 WHERE hotel_name = 'Windamere Retreat' AND destination = 'Darjeeling';
UPDATE "Hotels" SET latitude = 27.0470, longitude = 88.2680 WHERE hotel_name = 'The Himalayan Crown' AND destination = 'Darjeeling';

-- Update Jaipur Hotels
UPDATE "Hotels" SET latitude = 26.9120, longitude = 75.7870 WHERE hotel_name = 'Pink City Hostel' AND destination = 'Jaipur';
UPDATE "Hotels" SET latitude = 26.9150, longitude = 75.7890 WHERE hotel_name = 'Desert Guest House' AND destination = 'Jaipur';
UPDATE "Hotels" SET latitude = 26.9200, longitude = 75.7900 WHERE hotel_name = 'Rajputana Haveli' AND destination = 'Jaipur';
UPDATE "Hotels" SET latitude = 26.9250, longitude = 75.7950 WHERE hotel_name = 'Royal Palace View' AND destination = 'Jaipur';
UPDATE "Hotels" SET latitude = 26.9850, longitude = 75.8510 WHERE hotel_name = 'The Heritage Fort' AND destination = 'Jaipur';
UPDATE "Hotels" SET latitude = 26.9300, longitude = 75.8000 WHERE hotel_name = 'Maharaja Grand Taj' AND destination = 'Jaipur';

-- Update Darjeeling Activities
UPDATE "activities" SET latitude = 27.0510, longitude = 88.2560 WHERE activity_name = 'Darjeeling Ropeway Ride' AND destination = 'Darjeeling';
UPDATE "activities" SET latitude = 27.0500, longitude = 88.2570 WHERE activity_name = 'Premium Tea Estate Tasting Experience' AND destination = 'Darjeeling';
UPDATE "activities" SET latitude = 27.0440, longitude = 88.2670 WHERE activity_name = 'Mall Road Stroll' AND destination = 'Darjeeling';
UPDATE "activities" SET latitude = 27.0160, longitude = 88.2480 WHERE activity_name = 'Batasia Loop Entry' AND destination = 'Darjeeling';
UPDATE "activities" SET latitude = 27.0580, longitude = 88.2530 WHERE activity_name = 'Himalayan Mountaineering Institute Visit' AND destination = 'Darjeeling';
UPDATE "activities" SET latitude = 26.9960, longitude = 88.2860 WHERE activity_name = 'Private Tiger Hill Sunrise Tour' AND destination = 'Darjeeling';

-- Update Jaipur Activities
UPDATE "activities" SET latitude = 26.9230, longitude = 75.8260 WHERE activity_name = 'Hawa Mahal Outside View & Market Walk' AND destination = 'Jaipur';
UPDATE "activities" SET latitude = 26.9110, longitude = 75.8190 WHERE activity_name = 'Albert Hall Museum Entry' AND destination = 'Jaipur';
UPDATE "activities" SET latitude = 26.9850, longitude = 75.8510 WHERE activity_name = 'Amer Fort Guided Tour' AND destination = 'Jaipur';
UPDATE "activities" SET latitude = 26.9800, longitude = 75.8450 WHERE activity_name = 'Hot Air Balloon Safari' AND destination = 'Jaipur';

-- Update Digha Activities (handle both cases if table is Activities or activities)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Activities') THEN
        UPDATE "Activities" SET latitude = 21.6260, longitude = 87.5250 WHERE activity_name = 'Beach Walk and Sunrise Watching' AND destination = 'Digha';
        UPDATE "Activities" SET latitude = 21.6280, longitude = 87.5140 WHERE activity_name = 'Marine Aquarium and Regional Centre Visit' AND destination = 'Digha';
        UPDATE "Activities" SET latitude = 21.6230, longitude = 87.5020 WHERE activity_name = 'Parasailing at New Digha Beach' AND destination = 'Digha';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
        UPDATE "activities" SET latitude = 21.6260, longitude = 87.5250 WHERE activity_name = 'Beach Walk and Sunrise Watching' AND destination = 'Digha';
        UPDATE "activities" SET latitude = 21.6280, longitude = 87.5140 WHERE activity_name = 'Marine Aquarium and Regional Centre Visit' AND destination = 'Digha';
        UPDATE "activities" SET latitude = 21.6230, longitude = 87.5020 WHERE activity_name = 'Parasailing at New Digha Beach' AND destination = 'Digha';
    END IF;
END $$;

const testPlan = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Darjeeling',
        totalBudget: 40000,
        travellers: 2,
        days: 3,
        womenOnly: false
      })
    });
    
    if (!res.ok) {
      console.error('API Error:', await res.text());
      return;
    }
    
    const data = await res.json();
    if (data.withinBudget && data.withinBudget.length > 0) {
      const plan = data.withinBudget[0];
      console.log('--- Darjeeling Plan Data ---');
      console.log('Selected Hotel:', plan.selectedHotel.name);
      console.log('Coordinates:', { lat: plan.selectedHotel.latitude, lng: plan.selectedHotel.longitude });
      console.log('\nSelected Activities:');
      plan.selectedActivities.forEach(act => {
        console.log(`- ${act.activity_name}`);
        console.log(`  Coordinates:`, { lat: act.latitude, lng: act.longitude });
      });
      console.log('\nLegacy Fallback selectedActivity:', plan.selectedActivity?.activity_name);
    } else {
      console.log('No plan found within budget.');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
};

testPlan();

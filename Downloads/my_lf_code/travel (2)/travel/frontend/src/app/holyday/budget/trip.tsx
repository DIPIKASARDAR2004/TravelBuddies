const [budget, setBudget] = useState(0);
const [categories, setCategories] = useState({
  food: 0,
  travel: 0,
  stay: 0,
  shopping: 0,
  emergency: 0,
});

const setTripBudget = (total: number, type: string) => {
  setBudget(total);
  let split: any = {};

  if (type === "luxury") {
    split = { food: total * 0.25, travel: total * 0.35, stay: total * 0.3, shopping: total * 0.05, emergency: total * 0.05 };
  } else if (type === "backpacker") {
    split = { food: total * 0.3, travel: total * 0.25, stay: total * 0.2, shopping: total * 0.15, emergency: total * 0.1 };
  } else {
    // family (default)
    split = { food: total * 0.3, travel: total * 0.25, stay: total * 0.3, shopping: total * 0.1, emergency: total * 0.05 };
  }

  setCategories(split);
};

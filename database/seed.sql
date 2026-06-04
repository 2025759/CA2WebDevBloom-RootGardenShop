-- Bloom & Root Garden Shop seed data
-- Products: plants, pots, tools and care supplies (EUR base prices)

INSERT INTO products (name, category, description, base_price, image, stock) VALUES
('Monstera Deliciosa', 'Indoor Plants', 'Popular tropical houseplant with split leaves. Thrives in bright indirect light.', 34.99, '/images/plant-indoor.svg', 20),
('Snake Plant', 'Indoor Plants', 'Hardy sansevieria that tolerates low light and irregular watering.', 19.99, '/images/plant-snake.svg', 28),
('English Lavender', 'Outdoor Plants', 'Fragrant perennial ideal for borders, pots and attracting pollinators.', 12.50, '/images/plant-lavender.svg', 35),
('Cherry Tomato Seedlings', 'Outdoor Plants', 'Pack of 6 healthy seedlings ready for planting in beds or grow bags.', 8.50, '/images/plant-tomato.svg', 40),
('Terracotta Planter Set', 'Pots & Planters', 'Set of 3 hand-finished terracotta pots (15cm, 20cm, 25cm) with drainage holes.', 28.00, '/images/pot-terracotta.svg', 22),
('Self-Watering Herb Pot', 'Pots & Planters', 'Slim windowsill planter with water reservoir — perfect for basil and mint.', 16.99, '/images/pot-herb.svg', 18),
('Organic Compost 50L', 'Soil & Compost', 'Peat-reduced multi-purpose compost for pots, beds and seed sowing.', 18.99, '/images/compost.svg', 45),
('Hand Trowel & Fork Set', 'Garden Tools', 'Stainless steel tools with ergonomic ash handles for everyday gardening.', 22.50, '/images/tools-trowel.svg', 30),
('5L Watering Can', 'Garden Tools', 'Galvanised steel watering can with a fine rose for gentle watering.', 24.99, '/images/watering-can.svg', 16),
('Liquid Plant Feed 1L', 'Plant Care', 'Balanced NPK feed for houseplants and garden containers — lasts up to 3 months.', 9.99, '/images/plant-feed.svg', 50);

-- Default market rate (1.0 = no adjustment)
INSERT INTO market_rate (rate) VALUES (1.0);

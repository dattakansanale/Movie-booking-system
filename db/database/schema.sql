-- Create MySQL database for movie booking system
CREATE DATABASE IF NOT EXISTS movie_booking_system;
USE movie_booking_system;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- in minutes
    genre VARCHAR(100),
    rating DECIMAL(2,1),
    poster_url VARCHAR(500),
    release_date DATE,
    status ENUM('now_showing', 'coming_soon', 'ended') DEFAULT 'now_showing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theaters table
CREATE TABLE theaters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    total_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seats table
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    theater_id INT,
    seat_number VARCHAR(10) NOT NULL,
    seat_type ENUM('regular', 'premium', 'vip') DEFAULT 'regular',
    FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat (theater_id, seat_number)
);

-- Showtimes table
CREATE TABLE showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT,
    theater_id INT,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    available_seats INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    showtime_id INT,
    seats_booked INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
    booking_reference VARCHAR(20) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);

-- Booking seats junction table
CREATE TABLE booking_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    seat_id INT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_seat (booking_id, seat_id)
);

-- Insert sample data

-- Sample users
INSERT INTO users (name, email, password, phone) VALUES
('John Doe', 'john@example.com', '$2b$10$hash1', '+1234567890'),
('Jane Smith', 'jane@example.com', '$2b$10$hash2', '+1234567891'),
('Mike Johnson', 'mike@example.com', '$2b$10$hash3', '+1234567892'),
('Sarah Wilson', 'sarah@example.com', '$2b$10$hash4', '+1234567893');

-- Sample movies
INSERT INTO movies (title, description, duration, genre, rating, poster_url, release_date, status) VALUES
('Avengers: Endgame', 'The epic conclusion to the Infinity Saga that became a critically acclaimed worldwide phenomenon.', 181, 'Action/Adventure', 8.4, '/placeholder.svg?height=400&width=300', '2024-01-15', 'now_showing'),
('The Dark Knight', 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.', 152, 'Action/Crime', 9.0, '/placeholder.svg?height=400&width=300', '2024-01-20', 'now_showing'),
('Inception', 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', 148, 'Sci-Fi/Thriller', 8.8, '/placeholder.svg?height=400&width=300', '2024-02-01', 'now_showing'),
('Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.', 169, 'Sci-Fi/Drama', 8.6, '/placeholder.svg?height=400&width=300', '2024-02-15', 'now_showing'),
('The Matrix', 'A computer programmer is led to fight an underground war against powerful computers who have constructed his reality.', 136, 'Sci-Fi/Action', 8.7, '/placeholder.svg?height=400&width=300', '2024-03-01', 'coming_soon'),
('Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', 154, 'Crime/Drama', 8.9, '/placeholder.svg?height=400&width=300', '2024-03-15', 'coming_soon');

-- Sample theaters
INSERT INTO theaters (name, location, total_seats) VALUES
('Grand Cinema Hall 1', 'Downtown Plaza, Screen 1', 100),
('Grand Cinema Hall 2', 'Downtown Plaza, Screen 2', 120),
('Multiplex Theater A', 'Mall Complex, Theater A', 150),
('Multiplex Theater B', 'Mall Complex, Theater B', 80),
('IMAX Theater', 'Entertainment District', 200);

-- Generate seats for each theater
INSERT INTO seats (theater_id, seat_number, seat_type)
SELECT 
    t.id,
    CONCAT(
        CHAR(65 + FLOOR((s.seat_num - 1) / 10)), -- Row letter (A, B, C, etc.)
        LPAD((s.seat_num - 1) % 10 + 1, 2, '0')  -- Seat number (01, 02, etc.)
    ),
    CASE 
        WHEN s.seat_num <= t.total_seats * 0.6 THEN 'regular'
        WHEN s.seat_num <= t.total_seats * 0.9 THEN 'premium'
        ELSE 'vip'
    END
FROM theaters t
CROSS JOIN (
    SELECT a.N + b.N * 10 + c.N * 100 + 1 as seat_num
    FROM 
        (SELECT 0 as N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
        (SELECT 0 as N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
        (SELECT 0 as N UNION SELECT 1 UNION SELECT 2) c
) s
WHERE s.seat_num <= t.total_seats;

-- Sample showtimes for the next 7 days
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price, available_seats)
SELECT 
    m.id,
    t.id,
    DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY),
    TIME(CONCAT(h.hour, ':00:00')),
    CASE t.id
        WHEN 5 THEN 25.00  -- IMAX premium pricing
        ELSE 15.00
    END,
    t.total_seats
FROM movies m
CROSS JOIN theaters t
CROSS JOIN (SELECT 0 as day_offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
CROSS JOIN (SELECT 10 as hour UNION SELECT 13 UNION SELECT 16 UNION SELECT 19 UNION SELECT 22) h
WHERE m.status = 'now_showing'
ORDER BY m.id, t.id, d.day_offset, h.hour;

-- Sample bookings
INSERT INTO bookings (user_id, showtime_id, seats_booked, total_amount, booking_reference, status)
VALUES 
(1, 1, 2, 30.00, 'BK001', 'confirmed'),
(2, 5, 1, 15.00, 'BK002', 'confirmed'),
(3, 10, 3, 45.00, 'BK003', 'confirmed'),
(1, 15, 2, 50.00, 'BK004', 'confirmed'),
(4, 20, 1, 15.00, 'BK005', 'cancelled');

-- Sample booking seats (linking bookings to specific seats)
INSERT INTO booking_seats (booking_id, seat_id)
VALUES 
(1, 1), (1, 2),  -- Booking 1: seats A01, A02
(2, 25),         -- Booking 2: seat C05
(3, 50), (3, 51), (3, 52),  -- Booking 3: seats E10, F01, F02
(4, 301), (4, 302),  -- Booking 4: seats A01, A02 in theater 5
(5, 75);         -- Booking 5: seat H05 (cancelled)

-- Update available seats in showtimes based on confirmed bookings
UPDATE showtimes s
SET available_seats = s.available_seats - (
    SELECT COALESCE(SUM(b.seats_booked), 0)
    FROM bookings b
    WHERE b.showtime_id = s.id AND b.status = 'confirmed'
);

-- Create indexes for better performance
CREATE INDEX idx_movies_status ON movies(status);
CREATE INDEX idx_showtimes_date ON showtimes(show_date);
CREATE INDEX idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_seats_theater_type ON seats(theater_id, seat_type);

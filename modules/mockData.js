// Common mock data for the application
export const mockData = {
    users: [
        { id: 1, username: 'admin', role: 'מנהל', password: 'admin123', phone: '050-1234567' },
        { id: 2, username: 'operator1', role: 'מפעיל רגיל', password: 'pass123', phone: '052-7654321' },
        { id: 3, username: 'operator2', role: 'מפעיל רגיל', password: 'pass456', phone: '054-9876543' }
    ],
    
    alertAreas: [
        { 
            id: 1, 
            name: 'אזור צפון', 
            polygon: {
                type: 'Polygon',
                coordinates: [[[34.8, 32.1], [34.9, 32.1], [34.9, 32.2], [34.8, 32.2], [34.8, 32.1]]]
            }
        },
        { 
            id: 2, 
            name: 'אזור דרום', 
            polygon: {
                type: 'Polygon',
                coordinates: [[[34.7, 31.9], [34.8, 31.9], [34.8, 32.0], [34.7, 32.0], [34.7, 31.9]]]
            }
        }
    ],
    
    userLocations: [
        { id: 101, lat: 32.05, lng: 34.75, status: 'green', username: 'user1' },
        { id: 102, lat: 32.07, lng: 34.78, status: 'red', username: 'user2' },
        { id: 103, lat: 32.08, lng: 34.77, status: 'yellow', username: 'user3' },
        { id: 104, lat: 32.06, lng: 34.76, status: 'gray', username: 'user4' }
    ]
};
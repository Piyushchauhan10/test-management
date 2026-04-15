import { DEPARTMENTS, STATUSES } from './types/grid';

import type { GridRow, Department, Status, } from "./types/grid"

const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Steven', 'Ashley',
  'Paul', 'Dorothy', 'Andrew', 'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna',
  'Kevin', 'Michelle', 'Brian', 'Carol', 'George', 'Amanda', 'Timothy', 'Melissa',
  'Ronald', 'Deborah', 'Edward', 'Stephanie', 'Jason', 'Rebecca', 'Jeffrey', 'Sharon',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

export function generateMockData(count: number = 250): GridRow[] {
  return Array.from({ length: count }, (_, i) => {
    const first = randomFrom(firstNames);
    const last = randomFrom(lastNames);
    return {
      id: `row-${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@company.com`,
      department: randomFrom(DEPARTMENTS),
      status: randomFrom(STATUSES),
      salary: Math.floor(40000 + Math.random() * 160000),
      age: Math.floor(22 + Math.random() * 43),
      progress: Math.floor(Math.random() * 101),
      joinedDate: randomDate(new Date(2018, 0, 1), new Date(2024, 11, 31)),
    };
  });
}

export function createEmptyRow(): GridRow {
  const id = `row-${Date.now()}`;
  return {
    id,
    name: 'New User',
    email: 'new.user@company.com',
    department: 'Engineering',
    status: 'Pending',
    salary: 50000,
    age: 25,
    progress: 0,
    joinedDate: new Date().toISOString().split('T')[0],
  };
}

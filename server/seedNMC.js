require('dotenv').config();
const mongoose = require('mongoose');
const NMCRegistry = require('./models/NMCRegistry');

// Dummy NMC Registry Data
const dummyNMCData = [
  {
    regNo: '56117',
    name: 'BASANTANI RAJKUMAR BAKSHOMAL',
    sex: 'M',
    registrationDate: new Date('1986-02-20'),
    qualifications: ['Doctor in General Medicine'],
    university: 'NEW VISION UNIVERSITY, GEORGIA',
    yearOfPassing: '2026',
    address: 'D 3, DATTA KRUPA CHS LIMITED, PLOT NUMBER- 18 RSC 22, BEHIND MANGAL MURTI HOSPITAL, R WARD GORAI 1 BORIVALI WEST, MUMBAI',
    state: 'MAHARASHTRA',
  },
  {
    regNo: '20260100899',
    name: 'BRIJKESH SURENDRAKUMAR DHARKAR',
    sex: 'M',
    registrationDate: new Date('2026-01-30'),
    qualifications: ['M.B.B.S.'],
    university: 'POONA UNIV',
    yearOfPassing: '1989',
    address: 'S.NO.10/11, SUKHSAGAR NAGAR, KATRAJ, PUNE',
    state: 'MAHARASHTRA',
  },
  {
    regNo: '61850',
    name: 'GOSAVI VIKAS RATAN',
    sex: 'M',
    registrationDate: new Date('1989-06-30'),
    qualifications: ['M.B.B.S.'],
    university: 'POONA UNIV',
    yearOfPassing: '1997',
    address: '401, MANGAL DARSHAN, 14 TURNER ROAD, BANDRA MUMBAI',
    state: 'MAHARASHTRA',
  },
  {
    regNo: '86680',
    name: 'GULIANI SAMEER KISHANSAROOP',
    sex: 'M',
    registrationDate: new Date('1998-04-30'),
    qualifications: ['M.B.B.S.', 'Dip. Child Health'],
    university: 'MARATHWADA UNIV',
    yearOfPassing: '1997',
    address: 'HOUSE NO 2-10-1255 CHAITANYA PURI COLONY',
    state: 'TELANGANA',
  },
  {
    regNo: '82676',
    name: 'GURRAM CHUKK MAHIPAL REDDY',
    sex: 'M',
    registrationDate: new Date('1997-04-02'),
    qualifications: ['M.B.B.S.'],
    university: 'POONA UNIV',
    yearOfPassing: '1999',
    address: 'SHREEPATI ARCADE, 20TH FLR, FLAT NO 2002, AUGUST KANTI MARG, NEAR BMC OFFICE GRANT ROAD (WEST) MUMBAI',
    state: 'MAHARASHTRA',
  },
  {
    regNo: '90851',
    name: 'KADAKIA HEMAL HARESHBHAI',
    sex: 'M',
    registrationDate: new Date('1999-07-20'),
    qualifications: ['M.B.B.S.'],
    university: 'SHIVAJI UNIV',
    yearOfPassing: '1988',
    address: "2653 'C' WARD, SHANIWAR PETH, KOLHAPUR",
    state: 'MAHARASHTRA',
  },
  {
    regNo: '61543',
    name: 'KADAM PANDURANG',
    sex: 'M',
    registrationDate: new Date('1989-04-24'),
    qualifications: ['M.B.B.S.'],
    university: 'MARATHWADA UNIV',
    yearOfPassing: '1985',
    address: 'NEAR PATHRI OCTROI NAKA, MANWATH, PARBHANI',
    state: 'MAHARASHTRA',
  },
  {
    regNo: '92845',
    name: 'KHAN SYED AKRAM AHMED',
    sex: 'M',
    registrationDate: new Date('2000-05-15'),
    qualifications: ['M.B.B.S.', 'MD General Medicine'],
    university: 'BOMBAY UNIVERSITY',
    yearOfPassing: '2000',
    address: '42, QUEEN ELIZABETH ROAD, MUMBAI',
    state: 'MAHARASHTRA',
  },
  {
    regNo: '78932',
    name: 'SHARMA RAJESH KUMAR',
    sex: 'M',
    registrationDate: new Date('1995-03-10'),
    qualifications: ['M.B.B.S.', 'DNB'],
    university: 'DELHI UNIVERSITY',
    yearOfPassing: '1995',
    address: '156, SECTOR 5, NEW DELHI',
    state: 'DELHI',
  },
  {
    regNo: '85643',
    name: 'PATEL NEHA VIRAJ',
    sex: 'F',
    registrationDate: new Date('2001-08-12'),
    qualifications: ['M.B.B.S.', 'MS Surgery'],
    university: 'AHMEDABAD UNIVERSITY',
    yearOfPassing: '2001',
    address: '203, AHMEDABAD HEIGHTS, AHMEDABAD',
    state: 'GUJARAT',
  },
];

const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✓ MongoDB connected');

    try {
      // Clear existing NMC registry data
      await NMCRegistry.deleteMany({});
      console.log('✓ Cleared existing NMC registry data');

      // Insert dummy data
      const result = await NMCRegistry.insertMany(dummyNMCData);
      console.log(`✓ Successfully seeded ${result.length} NMC registry records`);

      console.log('\n📋 Sample NMC Records Added:');
      console.log('─'.repeat(60));
      result.slice(0, 3).forEach((doc) => {
        console.log(`  Reg No: ${doc.regNo} | Name: ${doc.name}`);
      });
      console.log('─'.repeat(60));

      process.exit(0);
    } catch (err) {
      console.error('✗ Seeding error:', err);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

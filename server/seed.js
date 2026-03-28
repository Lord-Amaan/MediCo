require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hospital = require('./models/Hospital');
const User = require('./models/User');
const Transfer = require('./models/Transfer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medico';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedHospitals = async () => {
  console.log('\n📋 Seeding hospitals...');

  const hospitals = [
    // PHC (2)
    {
      hospitalID: 'PHC001',
      name: 'Rural PHC - Ayodhya',
      type: 'PHC',
      state: 'Uttar Pradesh',
      city: 'Ayodhya',
      contact: {
        phone: '9876543210',
        email: 'phc.ayodhya@hospital.com',
        emergencyContact: '+91-9876543210',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Dr. Sharma', phone: '9876543210' },
        { name: 'Obstetrics', contactPerson: 'Dr. Verma', phone: '9876543211' },
      ],
      capabilities: ['General'], 
      isActive: true,
    },
    {
      hospitalID: 'PHC002',
      name: 'Rural PHC - Varanasi',
      type: 'PHC',
      state: 'Uttar Pradesh',
      city: 'Varanasi',
      contact: {
        phone: '9876543221',
        email: 'phc.varanasi@hospital.com',
        emergencyContact: '+91-9876543221',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Dr. Kumar', phone: '9876543221' },
        { name: 'Pediatrics', contactPerson: 'Dr. Singh', phone: '9876543222' },
      ],
      capabilities: ['General'],
      isActive: true,
    },

    // CHC (3)
    {
      hospitalID: 'CHC001',
      name: 'Community Health Centre - Lucknow',
      type: 'CHC',
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      contact: {
        phone: '9876543223',
        email: 'chc.lucknow@hospital.com',
        emergencyContact: '+91-9876543223',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Dr. Singh', phone: '9876543223' },
        { name: 'Surgery', contactPerson: 'Dr. Reddy', phone: '9876543224' },
        { name: 'Obstetrics', contactPerson: 'Dr. Patel', phone: '9876543225' },
        { name: 'Pediatrics', contactPerson: 'Dr. Mishra', phone: '9876543226' },
      ],
      capabilities: ['General', 'Surgery', 'Obstetrics'],
      isActive: true,
    },
    {
      hospitalID: 'CHC002',
      name: 'Community Health Centre - Agra',
      type: 'CHC',
      state: 'Uttar Pradesh',
      city: 'Agra',
      contact: {
        phone: '9876543227',
        email: 'chc.agra@hospital.com',
        emergencyContact: '+91-9876543227',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Dr. Patel', phone: '9876543227' },
        { name: 'Orthopedics', contactPerson: 'Dr. Verma', phone: '9876543228' },
        { name: 'ENT', contactPerson: 'Dr. Joshi', phone: '9876543229' },
      ],
      capabilities: ['General', 'Orthopedics'],
      isActive: true,
    },
    {
      hospitalID: 'CHC003',
      name: 'Community Health Centre - Kanpur',
      type: 'CHC',
      state: 'Uttar Pradesh',
      city: 'Kanpur',
      contact: {
        phone: '9876543230',
        email: 'chc.kanpur@hospital.com',
        emergencyContact: '+91-9876543230',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Dr. Verma', phone: '9876543230' },
        { name: 'Surgery', contactPerson: 'Dr. Nair', phone: '9876543231' },
        { name: 'Cardiology', contactPerson: 'Dr. Gupta', phone: '9876543232' },
      ],
      capabilities: ['General', 'Surgery', 'Cardiology'],
      isActive: true,
    },

    // District Hospital (3)
    {
      hospitalID: 'DH001',
      name: 'District Hospital - Lucknow',
      type: 'District',
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      contact: {
        phone: '9876543233',
        email: 'dh.lucknow@hospital.com',
        emergencyContact: '+91-9876543233',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Prof. Sharma', phone: '9876543233' },
        { name: 'Surgery', contactPerson: 'Prof. Singh', phone: '9876543234' },
        { name: 'Obstetrics', contactPerson: 'Prof. Desai', phone: '9876543235' },
        { name: 'Pediatrics', contactPerson: 'Prof. Kapoor', phone: '9876543236' },
        { name: 'Cardiology', contactPerson: 'Prof. Kumar', phone: '9876543237' },
        { name: 'Neurology', contactPerson: 'Prof. Rao', phone: '9876543238' },
      ],
      capabilities: ['General', 'Surgery', 'ICU', 'Cardiology', 'Neurology'],
      isActive: true,
    },
    {
      hospitalID: 'DH002',
      name: 'District Hospital - Varanasi',
      type: 'District',
      state: 'Uttar Pradesh',
      city: 'Varanasi',
      contact: {
        phone: '9876543239',
        email: 'dh.varanasi@hospital.com',
        emergencyContact: '+91-9876543239',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Prof. Singh', phone: '9876543239' },
        { name: 'Surgery', contactPerson: 'Prof. Patel', phone: '9876543240' },
        { name: 'Orthopedics', contactPerson: 'Prof. Mishra', phone: '9876543241' },
        { name: 'Ophthalmology', contactPerson: 'Prof. Gupta', phone: '9876543242' },
      ],
      capabilities: ['General', 'Surgery', 'Orthopedics'],
      isActive: true,
    },
    {
      hospitalID: 'DH003',
      name: 'District Hospital - Agra',
      type: 'District',
      state: 'Uttar Pradesh',
      city: 'Agra',
      contact: {
        phone: '9876543243',
        email: 'dh.agra@hospital.com',
        emergencyContact: '+91-9876543243',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Prof. Patel', phone: '9876543243' },
        { name: 'Surgery', contactPerson: 'Prof. Verma', phone: '9876543244' },
        { name: 'Emergency', contactPerson: 'Prof. Singh', phone: '9876543245' },
      ],
      capabilities: ['General', 'Surgery', 'Emergency'],
      isActive: true,
    },

    // Tertiary (Medical College) (2)
    {
      hospitalID: 'MED001',
      name: 'King George Medical University - Lucknow',
      type: 'Tertiary',
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      contact: {
        phone: '9876543246',
        email: 'kgmu.lucknow@hospital.com',
        emergencyContact: '+91-9876543246',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Prof. Reddy', phone: '9876543246' },
        { name: 'Surgery', contactPerson: 'Prof. Sharma', phone: '9876543247' },
        { name: 'Cardiology', contactPerson: 'Prof. Singh', phone: '9876543248' },
        { name: 'Neurology', contactPerson: 'Prof. Kumar', phone: '9876543249' },
        { name: 'Oncology', contactPerson: 'Prof. Patel', phone: '9876543250' },
        { name: 'Trauma', contactPerson: 'Prof. Verma', phone: '9876543251' },
      ],
      capabilities: ['General', 'Surgery', 'ICU', 'Cardiology', 'Neurology', 'Trauma'],
      isActive: true,
    },
    {
      hospitalID: 'MED002',
      name: 'Banaras Hindu University - Varanasi',
      type: 'Tertiary',
      state: 'Uttar Pradesh',
      city: 'Varanasi',
      contact: {
        phone: '9876543252',
        email: 'bhu.varanasi@hospital.com',
        emergencyContact: '+91-9876543252',
      },
      departments: [
        { name: 'General Medicine', contactPerson: 'Prof. Mishra', phone: '9876543252' },
        { name: 'Surgery', contactPerson: 'Prof. Singh', phone: '9876543253' },
        { name: 'Gastroenterology', contactPerson: 'Prof. Nair', phone: '9876543254' },
        { name: 'Nephrology', contactPerson: 'Prof. Gupta', phone: '9876543255' },
        { name: 'Trauma', contactPerson: 'Prof. Rao', phone: '9876543256' },
      ],
      capabilities: ['General', 'Surgery', 'ICU', 'Gastroenterology', 'Trauma'],
      isActive: true,
    },
  ];

  try {
    await Hospital.deleteMany({});
    const savedHospitals = await Hospital.insertMany(hospitals);
    console.log(`✅ Created ${savedHospitals.length} hospitals`);
    return savedHospitals;
  } catch (error) {
    console.error('❌ Error seeding hospitals:', error.message);
    throw error;
  }
};

const seedUsers = async () => {
  console.log('\n👨‍⚕️  Seeding test doctors...');

  const hospitals = await Hospital.find();
  
  // Create users with generated IDs
  const testUsers = [
    {
      userID: 'USR001',
      name: 'Dr. Rajesh Sharma',
      email: 'doctor1@ruralphc.com',
      password: 'test123',
      phone: '9876543220',
      role: 'Doctor',
      hospital: {
        hospitalID: hospitals[0]?._id,
        hospitalName: hospitals[0]?.name,
        department: 'General Medicine',
      },
      permissions: ['Create_Transfer', 'Review_Transfer'],
      qualifications: ['MBBS', 'MD'],
    },
    {
      userID: 'USR002',
      name: 'Dr. Priya Singh',
      email: 'doctor2@chc.com',
      password: 'test123',
      phone: '9876543221',
      role: 'Doctor',
      hospital: {
        hospitalID: hospitals[3]?._id,
        hospitalName: hospitals[3]?.name,
        department: 'Surgery',
      },
      permissions: ['Create_Transfer', 'Review_Transfer'],
      qualifications: ['MBBS', 'MS Surgery'],
    },
    {
      userID: 'USR003',
      name: 'Dr. Arun Kumar',
      email: 'doctor3@district.com',
      password: 'test123',
      phone: '9876543222',
      role: 'Doctor',
      hospital: {
        hospitalID: hospitals[6]?._id,
        hospitalName: hospitals[6]?.name,
        department: 'Cardiology',
      },
      permissions: ['Create_Transfer', 'Review_Transfer', 'Admin'],
      qualifications: ['MBBS', 'MD', 'DM Cardiology'],
    },
    {
      userID: 'USR004',
      name: 'Nurse Anita Verma',
      email: 'nurse1@hospital.com',
      password: 'test123',
      phone: '9876543223',
      role: 'Nurse',
      hospital: {
        hospitalID: hospitals[0]?._id,
        hospitalName: hospitals[0]?.name,
        department: 'General Medicine',
      },
      permissions: ['Review_Transfer'],
      qualifications: ['BSc Nursing', 'GNM'],
    },
    {
      userID: 'USR005',
      name: 'Admin User',
      email: 'admin@medico.com',
      password: 'test123',
      phone: '9876543224',
      role: 'Admin',
      hospital: null,
      permissions: ['Create_Transfer', 'Review_Transfer', 'Admin', 'Manage_System'],
      qualifications: [],
    },
  ];

  try {
    await User.deleteMany({});

    // Hash all passwords
    for (let user of testUsers) {
      user.passwordHash = await bcrypt.hash(user.password, 10);
      delete user.password; // Remove plain password
    }

    const savedUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${savedUsers.length} test users`);
    return savedUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    await seedHospitals();
    await seedUsers();

    console.log('\n✨ Database seeding complete!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: doctor1@ruralphc.com');
    console.log('   Password: test123');
    console.log('   Role: Doctor\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();

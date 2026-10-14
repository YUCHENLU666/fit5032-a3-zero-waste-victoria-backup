export const recyclingMaterials = [
  {
    id: 1,
    material: 'AA Batteries',
    category: 'Batteries',
    recyclable: 'Yes',
    disposalMethod:
      'Take to a designated battery recycling point.',
    dropOffType: 'Special Drop-off',
    riskLevel: 'Medium',
    notes:
      'Do not place loose batteries in general household recycling.',
  },

  {
    id: 2,
    material: 'Rechargeable Batteries',
    category: 'Batteries',
    recyclable: 'Yes',
    disposalMethod:
      'Take to a battery or e-waste collection facility.',
    dropOffType: 'Special Drop-off',
    riskLevel: 'High',
    notes:
      'Keep terminals protected where possible before transport.',
  },

  {
    id: 3,
    material: 'Button Cell Batteries',
    category: 'Batteries',
    recyclable: 'Yes',
    disposalMethod:
      'Use an approved battery recycling service.',
    dropOffType: 'Special Drop-off',
    riskLevel: 'High',
    notes:
      'Small batteries should be kept away from children.',
  },

  {
    id: 4,
    material: 'Laptop',
    category: 'E-Waste',
    recyclable: 'Yes',
    disposalMethod:
      'Take to an approved electronic waste collection point.',
    dropOffType: 'E-Waste Centre',
    riskLevel: 'Medium',
    notes:
      'Remove personal data before recycling the device.',
  },

  {
    id: 5,
    material: 'Mobile Phone',
    category: 'E-Waste',
    recyclable: 'Yes',
    disposalMethod:
      'Use a mobile phone or e-waste recycling program.',
    dropOffType: 'E-Waste Centre',
    riskLevel: 'Medium',
    notes:
      'Back up important information and erase personal data first.',
  },

  {
    id: 6,
    material: 'Computer Monitor',
    category: 'E-Waste',
    recyclable: 'Yes',
    disposalMethod:
      'Take to a designated e-waste recycling centre.',
    dropOffType: 'E-Waste Centre',
    riskLevel: 'Medium',
    notes:
      'Avoid damaging the screen during transport.',
  },

  {
    id: 7,
    material: 'Keyboard',
    category: 'E-Waste',
    recyclable: 'Yes',
    disposalMethod:
      'Take to an electronic waste collection facility.',
    dropOffType: 'E-Waste Centre',
    riskLevel: 'Low',
    notes:
      'Consider reuse or donation if the keyboard still works.',
  },

  {
    id: 8,
    material: 'Television',
    category: 'E-Waste',
    recyclable: 'Yes',
    disposalMethod:
      'Use an approved television or e-waste recycling service.',
    dropOffType: 'E-Waste Centre',
    riskLevel: 'Medium',
    notes:
      'Large devices may require dedicated drop-off facilities.',
  },

  {
    id: 9,
    material: 'Plastic Drink Bottle',
    category: 'Plastics',
    recyclable: 'Yes',
    disposalMethod:
      'Empty the bottle and place it in an appropriate recycling stream.',
    dropOffType: 'Kerbside / Drop-off',
    riskLevel: 'Low',
    notes:
      'Check local recycling guidance for accepted plastic types.',
  },

  {
    id: 10,
    material: 'Plastic Food Container',
    category: 'Plastics',
    recyclable: 'Yes',
    disposalMethod:
      'Remove food residue before placing it in an appropriate recycling stream.',
    dropOffType: 'Kerbside / Drop-off',
    riskLevel: 'Low',
    notes:
      'Containers should be reasonably clean before recycling.',
  },

  {
    id: 11,
    material: 'Soft Plastic Packaging',
    category: 'Plastics',
    recyclable: 'Limited',
    disposalMethod:
      'Use a specialist soft-plastic collection service where available.',
    dropOffType: 'Special Drop-off',
    riskLevel: 'Low',
    notes:
      'Soft plastics may not be accepted in standard household recycling.',
  },

  {
    id: 12,
    material: 'Plastic Storage Box',
    category: 'Plastics',
    recyclable: 'Depends',
    disposalMethod:
      'Check local facility requirements or consider reuse first.',
    dropOffType: 'Reuse / Drop-off',
    riskLevel: 'Low',
    notes:
      'Reusable containers should be reused or donated when practical.',
  },

  {
    id: 13,
    material: 'Cotton T-Shirt',
    category: 'Clothing',
    recyclable: 'Yes',
    disposalMethod:
      'Donate, reuse, repair, or take to a textile collection point.',
    dropOffType: 'Textile Collection',
    riskLevel: 'Low',
    notes:
      'Usable clothing should preferably be donated or reused.',
  },

  {
    id: 14,
    material: 'Jeans',
    category: 'Clothing',
    recyclable: 'Yes',
    disposalMethod:
      'Donate or use a textile recovery service.',
    dropOffType: 'Textile Collection',
    riskLevel: 'Low',
    notes:
      'Repairing damaged clothing can extend its usable life.',
  },

  {
    id: 15,
    material: 'Jacket',
    category: 'Clothing',
    recyclable: 'Yes',
    disposalMethod:
      'Donate suitable items or use a textile recycling collection point.',
    dropOffType: 'Textile Collection',
    riskLevel: 'Low',
    notes:
      'Clean wearable jackets are suitable for reuse programs.',
  },

  {
    id: 16,
    material: 'Old Shoes',
    category: 'Clothing',
    recyclable: 'Depends',
    disposalMethod:
      'Use a footwear reuse or specialist textile collection service.',
    dropOffType: 'Textile Collection',
    riskLevel: 'Low',
    notes:
      'Availability of footwear recycling varies by collection service.',
  },

  {
    id: 17,
    material: 'Wooden Chair',
    category: 'Furniture',
    recyclable: 'Yes',
    disposalMethod:
      'Reuse, donate, repair, or take to a furniture recovery facility.',
    dropOffType: 'Reuse Centre',
    riskLevel: 'Low',
    notes:
      'Furniture in usable condition should be prioritised for reuse.',
  },

  {
    id: 18,
    material: 'Dining Table',
    category: 'Furniture',
    recyclable: 'Yes',
    disposalMethod:
      'Donate or take to a furniture reuse and recovery centre.',
    dropOffType: 'Reuse Centre',
    riskLevel: 'Low',
    notes:
      'Check whether the facility accepts large furniture before visiting.',
  },

  {
    id: 19,
    material: 'Bookshelf',
    category: 'Furniture',
    recyclable: 'Yes',
    disposalMethod:
      'Reuse, donate, or take to a suitable recovery centre.',
    dropOffType: 'Reuse Centre',
    riskLevel: 'Low',
    notes:
      'Consider dismantling only if required by the receiving facility.',
  },

  {
    id: 20,
    material: 'Office Desk',
    category: 'Furniture',
    recyclable: 'Yes',
    disposalMethod:
      'Donate or use a furniture recovery service.',
    dropOffType: 'Reuse Centre',
    riskLevel: 'Low',
    notes:
      'Reusable desks can often be redirected to second-hand programs.',
  },

  {
    id: 21,
    material: 'Broken Smartphone',
    category: 'E-Waste',
    recyclable: 'Yes',
    disposalMethod:
      'Take to an approved electronics recycling service.',
    dropOffType: 'E-Waste Centre',
    riskLevel: 'Medium',
    notes:
      'Do not dispose of electronic devices in general waste where prohibited.',
  },

  {
    id: 22,
    material: 'Power Bank',
    category: 'Batteries',
    recyclable: 'Yes',
    disposalMethod:
      'Take to an approved battery or e-waste collection facility.',
    dropOffType: 'Special Drop-off',
    riskLevel: 'High',
    notes:
      'Power banks contain rechargeable batteries and require special handling.',
  },

  {
    id: 23,
    material: 'Plastic Plant Pot',
    category: 'Plastics',
    recyclable: 'Depends',
    disposalMethod:
      'Check local recycling acceptance or reuse the pot.',
    dropOffType: 'Reuse / Drop-off',
    riskLevel: 'Low',
    notes:
      'Accepted plastic types can vary between recycling facilities.',
  },

  {
    id: 24,
    material: 'Damaged Clothing',
    category: 'Clothing',
    recyclable: 'Yes',
    disposalMethod:
      'Use a textile recycling service rather than a donation stream.',
    dropOffType: 'Textile Collection',
    riskLevel: 'Low',
    notes:
      'Separate damaged textiles from clothing intended for direct reuse.',
  },
]
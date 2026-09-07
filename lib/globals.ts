export const time_conversions = ['A few hours', 'A few days', 'A couple of weeks','A month','A few months','6 months or more']  //used to convert numerical representation of time_required to readable form

export const yearGroups = [
    {value:'7', label:'Year 7'}, 
    {value:'8', label:'Year 8'}, 
    {value:'9', label:'Year 9'}, 
    {value:'10', label:'Year 10'}, 
    {value:'11', label:'Year 11'}, 
    {value:'12', label:'Year 12'}, 
    {value:'13', label:'Year 13'}
  ];


export const allSubjects = [
    {"value":"English Language","label":"English Language","url":"english-language"},
    {"value":"English Literature","label":"English Lit","url":"english-literature"},
    {"value":"Mathematics","label":"Mathematics","url":"mathematics"},
    {"value":"Further Mathematics","label":"Further Maths","url":"further-mathematics"},
    {"value":"Biology","label":"Biology","url":"biology"},
    {"value":"Chemistry","label":"Chemistry","url":"chemistry"},
    {"value":"Physics","label":"Physics","url":"physics"},
    {"value":"Double Science","label":"Double Science","url":"double-science"},
    {"value":"Science","label":"Science","url":"science"},
    {"value":"Computer Science","label":"Computer Science","url":"computer-science"},
    {"value":"History","label":"History","url":"history"},
    {"value":"Geography","label":"Geography","url":"geography"},
    {"value":"Economics","label":"Economics","url":"economics"},
    {"value":"Business","label":"Business Studies","url":"business"},
    {"value":"BTEC Business","label":"BTEC Business","url":"btec-business"},
    {"value":"Psychology","label":"Psychology","url":"psychology"},
    {"value":"Politics","label":"Politics","url":"politics"},
    {"value":"French","label":"French","url":"french"},
    {"value":"Spanish","label":"Spanish","url":"spanish"},
    {"value":"Arabic","label":"Arabic","url":"arabic"},
    {"value":"Ministry Arabic","label":"Ministry Arabic","url":"ministry-arabic"},
    {"value":"Islamic","label":"Islamic","url":"islamic"},
    {"value":"Art & Design","label":"Art & Design","url":"art-&-design"},
    {"value":"Graphic Communications","label":"Graphics","url":"graphic-communications"},
    {"value":"Photography","label":"Photography","url":"photography"},
    {"value":"Media Studies","label":"Media Studies","url":"media-studies"},
    {"value":"Music","label":"Music","url":"music"},
    {"value":"Drama","label":"Drama","url":"drama"},
    {"value":"PE","label":"PE","url":"pe"},
    {"value":"BTEC Sport","label":"BTEC Sport","url":"btec-sport"},
    {"value":"Engineering","label":"BTEC Engineering","url":"engineering"},
    {"value":"Product Design","label":"Product Design","url":"product-design"},
    {"value":"Textiles","label":"Textiles","url":"textiles"},
    {"value":"Food Tech","label":"Food Tech","url":"food-tech"},
    {"value":"EPQ","label":"EPQ","url":"epq"}
  ]

const removedList = ['EPQ', 'BTEC Sport', 'BTEC Business', 'Further Mathematics', 'Double Science', 'Science', 'Ministry Arabic'];
const removedForOnboarding = ['EPQ','Double Science','Science','Ministry Arabic'];
export const filteredSubjects = allSubjects.filter((subject: any) => !removedList.includes(subject.value));

export const removedForGCSE = ['BTEC Sport', 'BTEC Business', 'Further Mathematics', 'Politics', 'Engineering','Psychology', 'Biology', 'Chemistry', 'Physics', 'English Language', 'English Literature', 'Mathematics', 'Islamic'];
export const filteredSubjectsForOnboarding = allSubjects.filter((subject: any) => !removedForOnboarding.includes(subject.value));

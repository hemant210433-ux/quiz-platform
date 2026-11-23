/**
 * M2-R5 HTML practice lab: project-style set of practice questions, each with its own code and a live output.
 * Written for self-practice. These are NOT NIELIT exam questions and say nothing about the exam pattern.
 * Code is HTML only (no CSS, no JavaScript) so beginners can type it in Notepad and open it in a browser.
 * Asset names used in code (college.svg, go.svg, logo.svg, shapes.svg, poster.svg, clip.wav, clip.mp4) are served from /practical-assets.
 */
export const PRACTICAL_UPDATED = '2026-11-23';

export const TOPICS = [
  { id: 't1', hi: 'टॉपिक 1: Web Designing और Publishing', en: 'Topic 1: Web Designing & Publishing', color: 'bg-sky-50' },
  { id: 'text', hi: 'टॉपिक 2: HTML – Text, Links और Images', en: 'Topic 2: HTML – Text, Links and Images', color: 'bg-emerald-50' },
  { id: 'tables', hi: 'टॉपिक 2: HTML – Tables', en: 'Topic 2: HTML – Tables', color: 'bg-amber-50' },
  { id: 'forms', hi: 'टॉपिक 2: HTML – Forms', en: 'Topic 2: HTML – Forms', color: 'bg-purple-50' },
  { id: 'frames', hi: 'टॉपिक 2: HTML – Frames', en: 'Topic 2: HTML – Frames', color: 'bg-pink-50' },
  { id: 'html5', hi: 'HTML5 (सिलेबस के टॉपिक)', en: 'HTML5 (syllabus topics)', color: 'bg-cyan-50' },
];

const f = (name, code) => ({ name, code: code.trim() });
const page = (title, body) => `<!DOCTYPE html>\n<html>\n<head>\n<title>${title}</title>\n</head>\n<body>\n${body.trim()}\n</body>\n</html>`;

export const PRACTICALS = [
  // ---------------- Topic 1 ----------------
  {
    id: 't1-q1-display-as-is', label: 'T1 Q1', topic: 't1',
    hi: '<pre> से text जैसा है वैसा दिखाओ', en: 'Display contents as it is (<pre>)',
    question: 'Make a web page that shows a poem and a postal address exactly as typed, keeping every space and line break. Then show the same address without the special tag to see the difference.',
    tags: ['pre', 'h3'],
    files: [f('index.html', page('Pre tag', `
<h3>Poem</h3>
<pre>
        My Computer
        -----------
  A screen to see, a key to press,
  A mouse to click and save my mess.
  It works all day and never sleeps,
  And every file it safely keeps.
</pre>
<h3>Address</h3>
<pre>
To,
    The Principal,
    Govt. Polytechnic College,
    Main Road, Bhopal (M.P.)
    PIN - 462001
</pre>
<h3>Same text without pre</h3>
<p>To,
    The Principal,
    Govt. Polytechnic College,
    Main Road, Bhopal (M.P.)</p>
<p><font color="red">Note: without pre the browser joins all lines and extra spaces into one line.</font></p>`))],
  },
  {
    id: 't1-q2-lists', label: 'T1 Q2', topic: 't1',
    hi: 'HTML में Lists', en: 'Lists in HTML',
    question: 'Build a page that demonstrates all three kinds of HTML lists: ordered, unordered and definition list.',
    tags: ['ol', 'ul', 'dl', 'li'],
    files: [f('index.html', page('Lists', `
<h3>Ordered List</h3>
<ol>
  <li>Switch on the computer</li>
  <li>Open the browser</li>
  <li>Type the website address</li>
</ol>
<h3>Unordered List</h3>
<ul>
  <li>Keyboard</li>
  <li>Mouse</li>
  <li>Monitor</li>
</ul>
<h3>Definition List</h3>
<dl>
  <dt><b>HTML</b></dt>
  <dd>Hyper Text Markup Language</dd>
  <dt><b>WWW</b></dt>
  <dd>World Wide Web</dd>
</dl>`))],
  },

  // ---------------- Text, links, images ----------------
  {
    id: 'q03-clickable-image', label: 'Q3', topic: 'text',
    hi: 'Clickable image (image map)', en: 'Clickable image (image map)',
    question: 'Show two uses of images as links: a single image that opens a page, and one image with three clickable regions (square, circle, triangle) that open three different pages.',
    tags: ['img', 'a', 'map', 'area'],
    files: [
      f('index.html', page('Clickable Image', `
<h3>1. Image as a link</h3>
<p>Click the orange button to open the Home page.</p>
<a href="home.html"><img src="go.svg" alt="Go" width="80" height="80" border="0"></a>

<h3>2. Image Map (different parts open different pages)</h3>
<p>Click the square, the circle or the triangle.</p>
<img src="shapes.svg" alt="Shapes" width="600" height="250" usemap="#shapes">
<map name="shapes">
  <area shape="rect" coords="30,35,210,215" href="html.html" alt="HTML">
  <area shape="circle" coords="320,125,90" href="css.html" alt="CSS">
  <area shape="poly" coords="500,30,430,215,570,215" href="js.html" alt="JS">
</map>`)),
      f('home.html', page('Home', '<h2>Home page</h2>\n<p><a href="index.html">Back</a></p>')),
      f('html.html', page('HTML', '<h2>You clicked the square: HTML</h2>\n<p><a href="index.html">Back</a></p>')),
      f('css.html', page('CSS', '<h2>You clicked the circle: CSS</h2>\n<p><a href="index.html">Back</a></p>')),
      f('js.html', page('JS', '<h2>You clicked the triangle: JS</h2>\n<p><a href="index.html">Back</a></p>')),
    ],
  },
  {
    id: 'q05-country-red', label: 'Q5', topic: 'text',
    hi: 'देश का नाम लाल रंग में', en: 'Country name in red colour',
    question: 'Write HTML that prints a country name in red, then list four Asian countries with their capitals, with each country name in red.',
    tags: ['font', 'color'],
    files: [f('index.html', page('Red text', `
<p>My country is <font color="red"><b>INDIA</b></font>.</p>
<h3>Some countries of Asia</h3>
<ul>
  <li><font color="red">India</font> - New Delhi</li>
  <li><font color="red">Nepal</font> - Kathmandu</li>
  <li><font color="red">Japan</font> - Tokyo</li>
  <li><font color="red">Sri Lanka</font> - Colombo</li>
</ul>
<p><small>Tag used: &lt;font color="red"&gt; ... &lt;/font&gt;</small></p>`))],
  },
  {
    id: 'q06-department', label: 'Q6', topic: 'text',
    hi: 'अपने Department का पेज (paragraph और lists)', en: 'Department page (paragraph and lists)',
    question: 'Design a page about a college department using a heading, paragraphs, an ordered list of courses, an unordered list of facilities and a definition list of teachers.',
    tags: ['h1', 'p', 'ol', 'ul', 'dl'],
    files: [f('index.html', page('Department', `
<h1 align="center">Department of Computer Science</h1>
<p>The Department of Computer Science was started in the year <b>2010</b>. It trains students in programming, web designing and networking. The department has modern labs and experienced teachers.</p>
<p>Students take part in coding contests, project exhibitions and industrial visits every year.</p>
<h3>Courses Offered</h3>
<ol>
  <li>O Level (NIELIT)</li>
  <li>CCC</li>
  <li>Diploma in Computer Application</li>
</ol>
<h3>Facilities</h3>
<ul>
  <li>Two computer labs with 60 systems</li>
  <li>High speed internet</li>
  <li>Library with 2000 books</li>
</ul>
<h3>Faculty</h3>
<dl>
  <dt><b>Mr. R. K. Sharma</b></dt><dd>Head of Department, Networking</dd>
  <dt><b>Ms. Anjali Verma</b></dt><dd>Web Designing and Python</dd>
</dl>`))],
  },
  {
    id: 'q07-first-page', label: 'Q7', topic: 'text',
    hi: 'पहला HTML document (head section)', en: 'First HTML document (head section)',
    question: 'Create your first HTML file with the complete basic structure: document type, head section with meta tags and a title, and a body with a comment, a heading and a paragraph.',
    tags: ['html', 'head', 'meta', 'title', 'body', 'comment'],
    steps: ['Open a code editor such as Notepad++ or VS Code.', 'Click File > New.', 'Type the basic structure of HTML (shown in the code).', 'Save the file as first.html (choose "All Files" as type).', 'Double-click the file to open it in a web browser.'],
    files: [f('first.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="description" content="My first page">
  <meta name="keywords" content="HTML, O Level">
  <meta name="author" content="Student Name">
  <title>My First Page</title>
</head>
<body>
  <!-- This is a comment. It is not shown in the browser. -->
  <h1>Hello World</h1>
  <p>This is my first web page.</p>
</body>
</html>`)],
  },
  {
    id: 'q08-polynomial', label: 'Q8', topic: 'text',
    hi: 'Polynomial expression (sup, sub)', en: 'Polynomial expression (sup, sub)',
    question: 'Write a page that shows algebraic identities with powers and chemical or series terms with small lower numbers, using superscript and subscript.',
    tags: ['sup', 'sub'],
    files: [f('index.html', page('Polynomial', `
<h4>Using &lt;sup&gt; (superscript)</h4>
<p>(a + b)<sup>2</sup> = a<sup>2</sup> + 2ab + b<sup>2</sup></p>
<p>(a - b)<sup>2</sup> = a<sup>2</sup> - 2ab + b<sup>2</sup></p>
<p>x<sup>3</sup> + 3x<sup>2</sup>y + 3xy<sup>2</sup> + y<sup>3</sup> = (x + y)<sup>3</sup></p>
<h4>Using &lt;sub&gt; (subscript)</h4>
<p>H<sub>2</sub>O &nbsp; CO<sub>2</sub> &nbsp; a<sub>1</sub> + a<sub>2</sub> + a<sub>3</sub> + ... + a<sub>n</sub></p>`))],
  },
  {
    id: 'q09-welcome', label: 'Q9', topic: 'text',
    hi: 'welcome.html (title, background, image, link)', en: 'welcome.html',
    question: 'Create welcome.html with a page title, a coloured background, a centred heading, an image, a paragraph with bold, italic and underlined words, a horizontal line and a link to another page.',
    tags: ['title', 'bgcolor', 'h1', 'img', 'hr', 'a'],
    files: [
      f('welcome.html', `<!DOCTYPE html>
<html>
<head>
  <title>Welcome</title>
</head>
<body bgcolor="lightyellow">
  <h1 align="center"><font color="orangered">Welcome to Our Computer Lab</font></h1>
  <p align="center"><img src="college.svg" alt="College" width="360" height="200"></p>
  <p>This is the <b>welcome page</b> of our lab. Here you will learn <i>HTML</i>, <u>web designing</u> and how to publish a website.</p>
  <hr width="60%" color="orangered" size="3">
  <p align="center"><a href="index.html">Click here to see all practicals</a></p>
</body>
</html>`),
      f('index.html', page('All practicals', '<h2>All practicals</h2>\n<p><a href="welcome.html">Back to welcome page</a></p>')),
    ],
    main: 'welcome.html',
  },
  {
    id: 'q10-anchor-behaviors', label: 'Q10', topic: 'text',
    hi: 'Anchor tag के अलग-अलग व्यवहार', en: 'Anchor tag behaviours',
    question: 'Make a table that shows eight different things a link can do: open a page, open a new tab, jump within the page, jump to a part of another page, send an email, start a phone call, download a file and show a tooltip.',
    tags: ['a', 'href', 'target', 'mailto', 'tel', 'download', 'title', 'id'],
    files: [
      f('index.html', page('Anchor tag', `
<a name="top"></a>
<table border="1" cellpadding="6">
  <tr><th>Behavior</th><th>Example</th></tr>
  <tr><td>Link to another page (same window)</td><td><a href="second.html">Open second page</a></td></tr>
  <tr><td>Open in a new tab / window</td><td><a href="https://www.google.com" target="_blank">Google (new tab)</a></td></tr>
  <tr><td>Jump inside the same page</td><td><a href="#bottom">Go to bottom of this page</a></td></tr>
  <tr><td>Jump to a section of another page</td><td><a href="second.html#html5">Second page - HTML5 section</a></td></tr>
  <tr><td>Email link</td><td><a href="mailto:lab@example.com">Send email</a></td></tr>
  <tr><td>Phone link</td><td><a href="tel:+911234567890">Call the lab</a></td></tr>
  <tr><td>Download a file</td><td><a href="logo.svg" download>Download logo</a></td></tr>
  <tr><td>Link with tooltip</td><td><a href="second.html" title="This is a tooltip">Hover on me</a></td></tr>
</table>
<p>Scroll down...</p>
<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
<h3 id="bottom">Bottom of the page</h3>
<a href="#top">Back to top</a>`)),
      f('second.html', page('Second page', '<h2>Second page</h2>\n<p>Some text.</p>\n<br><br><br><br><br><br><br><br><br><br><br><br>\n<h3 id="html5">HTML5 section</h3>\n<p>You jumped here from another page.</p>\n<p><a href="index.html">Back</a></p>')),
    ],
  },
  {
    id: 'q11-hypertext-links', label: 'Q11', topic: 'text',
    hi: 'एक document से दूसरे में hypertext links', en: 'Hypertext links',
    question: 'Connect pages with hyperlinks: a relative link to a second document, a link to a department page and an absolute link to an outside website.',
    tags: ['a', 'href', 'relative link', 'absolute link'],
    files: [
      f('index.html', page('Hypertext', `
<p>Hypertext means text that contains <b>links</b> to other documents.</p>
<ul>
  <li><a href="second.html">Go to Second Document</a> (relative link, same folder)</li>
  <li><a href="department.html">Read about our Department</a></li>
  <li><a href="https://www.nielit.gov.in" target="_blank">NIELIT website</a> (absolute link)</li>
</ul>`)),
      f('second.html', page('Second', '<h2>Question 11 - Second Document</h2>\n<p>You have reached the <b>second document</b>.</p>\n<p><a href="index.html">Go back to the first document</a></p>')),
      f('department.html', page('Department', '<h2>Our Department</h2>\n<p>Department of Computer Science.</p>\n<p><a href="index.html">Go back</a></p>')),
    ],
  },
  {
    id: 'q12-google-new-window', label: 'Q12', topic: 'text',
    hi: 'Google को नई window में खोलो', en: 'Google in a new window',
    question: 'Add a link that takes the visitor to Google but opens it in a new window or tab, and explain the attribute that does this.',
    tags: ['a', 'target', '_blank'],
    files: [f('index.html', page('New window', `
<h3><a href="https://www.google.com" target="_blank">Open Google in a new window</a></h3>
<p>Code: <code>&lt;a href="https://www.google.com" target="_blank"&gt;Open Google in a new window&lt;/a&gt;</code></p>
<p><b>target="_blank"</b> opens the link in a new window or tab.</p>`))],
  },
  {
    id: 'q13-lists', label: 'Q13', topic: 'text',
    hi: 'अलग-अलग प्रकार की lists', en: 'Different lists',
    question: 'Show different list styles on one page: lettered (capital and small), roman numbered, numbering that starts at 5, square and circle bullets, a nested list and a list that counts backwards.',
    tags: ['ol', 'ul', 'type', 'start', 'reversed', 'nested list'],
    files: [f('index.html', page('Lists', `
<h4>Capital letters (type="A")</h4>
<ol type="A"><li>Monday</li><li>Tuesday</li><li>Wednesday</li></ol>
<h4>Small letters (type="a")</h4>
<ol type="a"><li>Apple</li><li>Banana</li><li>Cherry</li></ol>
<h4>Roman numbers (type="I")</h4>
<ol type="I"><li>Input</li><li>Process</li><li>Output</li></ol>
<h4>Start from 5 (start="5")</h4>
<ol start="5"><li>Five</li><li>Six</li><li>Seven</li></ol>
<h4>Square bullets (type="square")</h4>
<ul type="square"><li>Pen</li><li>Pencil</li><li>Eraser</li></ul>
<h4>Circle bullets (type="circle")</h4>
<ul type="circle"><li>Red</li><li>Green</li><li>Blue</li></ul>
<h4>Nested list</h4>
<ol>
  <li>Hardware
    <ul><li>CPU</li><li>Printer</li></ul>
  </li>
  <li>Software
    <ul><li>Windows</li><li>MS Word</li></ul>
  </li>
</ol>
<h4>Reversed list</h4>
<ol reversed><li>One</li><li>Two</li><li>Three</li></ol>`))],
  },
  {
    id: 'q14-output', label: 'Q14', topic: 'text',
    hi: 'Formatting वाला output बनाओ', en: 'Formatting output',
    question: 'Recreate a formatting sampler: all six heading sizes, bold, italic, underline, strike-through, highlight, small text, price change, sub/superscript, coloured font, alignment, line break, block quote and an abbreviation with a tooltip.',
    tags: ['h1-h6', 'b', 'i', 'u', 'strike', 'mark', 'small', 'blockquote', 'abbr', 'br'],
    files: [f('index.html', page('Formatting', `
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>
<hr>
<p><b>Bold text</b> | <i>Italic text</i> | <u>Underlined text</u> | <strike>Strikethrough text</strike></p>
<p><strong>Important text</strong> | <em>Emphasized text</em> | <mark>Highlighted text</mark> | <small>Small text</small></p>
<p>Old price: <del>Rs. 999</del> New price: <ins>Rs. 499</ins></p>
<p>Water: H<sub>2</sub>O &nbsp; Square: x<sup>2</sup></p>
<p><font face="Courier New" color="green" size="4">Text in Courier New, green, size 4</font></p>
<p align="center">This paragraph is in the center.</p>
<p align="right">This paragraph is on the right.</p>
<p>Line one<br>Line two (after &lt;br&gt;)</p>
<blockquote>A blockquote is shown with space on the left side.</blockquote>
<p><abbr title="World Health Organization">WHO</abbr> - move the mouse on WHO to see the full form.</p>`))],
  },
  {
    id: 'q27-two-pages', label: 'Q27', topic: 'text',
    hi: 'page1.html और page2.html आपस में जुड़े', en: 'page1.html and page2.html',
    question: 'Create two pages, page1.html and page2.html, each with a link that opens the other.',
    tags: ['a', 'href', 'bgcolor'],
    files: [
      f('page1.html', `<!DOCTYPE html>
<html>
<head><title>Page 1</title></head>
<body bgcolor="lightcyan">
<h1 align="center">This is Page 1</h1>
<p align="center">Click the link below to open Page 2.</p>
<h2 align="center"><a href="page2.html">Go to Page 2 &gt;&gt;</a></h2>
</body>
</html>`),
      f('page2.html', page('Page 2', `
<h1 align="center">This is Page 2</h1>
<p align="center">Click the link below to go back to Page 1.</p>
<h2 align="center"><a href="page1.html">&lt;&lt; Back to Page 1</a></h2>`)),
    ],
    main: 'page1.html',
  },

  // ---------------- Tables ----------------
  {
    id: 'q01-table-5x4', label: 'Q1', topic: 'tables',
    hi: '5 rows और 4 columns वाली table', en: 'Table with 5 rows and 4 columns',
    question: 'Draw a table of students with a heading row and four data rows and four columns (roll number, name, city, mobile), and give the table a caption.',
    tags: ['table', 'tr', 'th', 'td', 'caption', 'border'],
    files: [f('index.html', page('Table 5x4', `
<table border="1" cellpadding="6" align="center">
  <caption><b>Student Contact List</b></caption>
  <tr><th>Roll No</th><th>Name</th><th>City</th><th>Mobile</th></tr>
  <tr><td>1</td><td>Aman</td><td>Bhopal</td><td>9876500001</td></tr>
  <tr><td>2</td><td>Priya</td><td>Indore</td><td>9876500002</td></tr>
  <tr><td>3</td><td>Rahul</td><td>Gwalior</td><td>9876500003</td></tr>
  <tr><td>4</td><td>Neha</td><td>Jabalpur</td><td>9876500004</td></tr>
</table>
<p align="center">This table has <b>5 rows</b> (1 heading row + 4 data rows) and <b>4 columns</b>.</p>`))],
  },
  {
    id: 'q02-marks-table', label: 'Q2', topic: 'tables',
    hi: 'Marks table (colspan)', en: 'Marks table',
    question: "Show students' marks in four modules with a total column, and add a last row that spans the first five columns to show the class average.",
    tags: ['table', 'colspan', 'bgcolor', 'align'],
    files: [f('index.html', page('Marks', `
<table border="2" cellpadding="6" align="center">
  <caption><b>Result of O Level Students</b></caption>
  <tr bgcolor="lightblue"><th>Name</th><th>M1-R5</th><th>M2-R5</th><th>M3-R5</th><th>M4-R5</th><th>Total</th></tr>
  <tr align="center"><td>Aman</td><td>78</td><td>82</td><td>75</td><td>80</td><td>315</td></tr>
  <tr align="center"><td>Priya</td><td>88</td><td>91</td><td>84</td><td>86</td><td>349</td></tr>
  <tr align="center"><td>Rahul</td><td>65</td><td>70</td><td>68</td><td>72</td><td>275</td></tr>
  <tr bgcolor="papayawhip"><td colspan="5" align="right"><b>Class Average</b></td><td align="center">313</td></tr>
</table>`))],
  },
  {
    id: 'q15-time-table', label: 'Q15', topic: 'tables',
    hi: 'Time table (rowspan, colspan)', en: 'Time table (rowspan, colspan)',
    question: 'Design a weekly class time table for Monday to Friday where one lunch cell spans all five days and some lab periods span two columns.',
    tags: ['table', 'rowspan', 'colspan'],
    files: [f('index.html', page('Time Table', `
<table border="1" cellpadding="6" align="center" width="90%">
  <caption><h3>Class Time Table</h3></caption>
  <tr bgcolor="#1b4a8c"><th><font color="white">Day</font></th><th><font color="white">10:00 - 11:00</font></th><th><font color="white">11:00 - 12:00</font></th><th><font color="white">12:00 - 12:30</font></th><th><font color="white">12:30 - 1:30</font></th><th><font color="white">1:30 - 2:30</font></th></tr>
  <tr align="center"><td><b>Monday</b></td><td>HTML</td><td>Python</td><td rowspan="5" bgcolor="navajowhite"><b>L<br>U<br>N<br>C<br>H</b></td><td colspan="2">Lab - Web Design</td></tr>
  <tr align="center"><td><b>Tuesday</b></td><td>IT Tools</td><td>HTML</td><td>Python</td><td>IoT</td></tr>
  <tr align="center"><td><b>Wednesday</b></td><td colspan="2">Lab - Python</td><td>HTML</td><td>IT Tools</td></tr>
  <tr align="center"><td><b>Thursday</b></td><td>IoT</td><td>HTML</td><td>Python</td><td>Library</td></tr>
  <tr align="center"><td><b>Friday</b></td><td>Python</td><td>IT Tools</td><td colspan="2">Lab - IoT</td></tr>
</table>`))],
  },
  {
    id: 'q16-complex-time-table', label: 'Q16', topic: 'tables',
    hi: 'Complex time table', en: 'Complex time table',
    question: 'Design a two-batch weekly time table with grouped headings (Morning, Afternoon), a break column and cells that span several rows and columns.',
    tags: ['table', 'rowspan', 'colspan'],
    files: [f('index.html', page('Complex Time Table', `
<table border="1" cellpadding="6" align="center" width="95%">
  <caption><h3>Weekly Time Table - O Level Batch A and B</h3></caption>
  <tr bgcolor="teal" align="center"><th rowspan="2"><font color="white">Day</font></th><th colspan="2"><font color="white">Morning</font></th><th rowspan="2"><font color="white">Break</font></th><th colspan="2"><font color="white">Afternoon</font></th></tr>
  <tr bgcolor="lightseagreen" align="center"><th>9 - 10</th><th>10 - 11</th><th>11:30 - 12:30</th><th>12:30 - 1:30</th></tr>
  <tr align="center"><td rowspan="2"><b>Mon</b></td><td>A: HTML</td><td>A: Python</td><td rowspan="6" bgcolor="lemonchiffon"><b>TEA<br>BREAK</b></td><td colspan="2" rowspan="2">Lab (Both Batches)</td></tr>
  <tr align="center"><td>B: Python</td><td>B: HTML</td></tr>
  <tr align="center"><td rowspan="2"><b>Wed</b></td><td colspan="2" rowspan="2">A and B: IT Tools (Seminar Hall)</td><td>A: IoT</td><td>A: HTML</td></tr>
  <tr align="center"><td>B: HTML</td><td>B: IoT</td></tr>
  <tr align="center"><td rowspan="2"><b>Fri</b></td><td>A: Test</td><td rowspan="2">Doubt Class</td><td colspan="2" rowspan="2">Project Work</td></tr>
  <tr align="center"><td>B: Test</td></tr>
</table>`))],
  },
  {
    id: 'q17-basic-table', label: 'Q17', topic: 'tables',
    hi: 'Basic table', en: 'Basic table',
    question: 'Create a simple three-column table of items, quantities and prices using table, row, heading and data tags.',
    tags: ['table', 'tr', 'th', 'td'],
    files: [f('index.html', page('Basic Table', `
<table border="1" cellpadding="4" cellspacing="2">
  <tr><th>Item</th><th>Quantity</th><th>Price</th></tr>
  <tr><td>Pen</td><td>10</td><td>Rs. 50</td></tr>
  <tr><td>Notebook</td><td>5</td><td>Rs. 200</td></tr>
  <tr><td>Pencil</td><td>12</td><td>Rs. 60</td></tr>
</table>
<p>Tags used: <b>&lt;table&gt;</b> (table), <b>&lt;tr&gt;</b> (row), <b>&lt;th&gt;</b> (heading cell), <b>&lt;td&gt;</b> (data cell).</p>`))],
  },
  {
    id: 'q18-complex-table', label: 'Q18', topic: 'tables',
    hi: 'Complex table (rowspan + colspan)', en: 'Complex table',
    question: 'Build a mark sheet table with grouped headings Theory and Practical, merged Roll No/Name/Total headings and one absent student whose marks cells are merged.',
    tags: ['table', 'rowspan', 'colspan'],
    files: [f('index.html', page('Mark Sheet', `
<table border="1" cellpadding="6" align="center" width="85%">
  <caption><b>Mark Sheet</b></caption>
  <tr align="center" bgcolor="lavender"><th rowspan="2">Roll No</th><th rowspan="2">Name</th><th colspan="2">Theory</th><th colspan="2">Practical</th><th rowspan="2">Total</th></tr>
  <tr align="center" bgcolor="lavender"><th>M2-R5</th><th>M3-R5</th><th>M2-R5</th><th>M3-R5</th></tr>
  <tr align="center"><td>101</td><td>Aman</td><td>70</td><td>65</td><td>45</td><td>48</td><td>228</td></tr>
  <tr align="center"><td>102</td><td>Priya</td><td>82</td><td>79</td><td>49</td><td>47</td><td>257</td></tr>
  <tr align="center"><td>103</td><td>Rahul</td><td colspan="4"><font color="red">Absent</font></td><td>-</td></tr>
</table>`))],
  },
  {
    id: 'q19-college-layout', label: 'Q19', topic: 'tables',
    hi: 'Table से College infrastructure का layout', en: 'College infrastructure (table layout)',
    question: 'Use a table (not CSS) to lay out a college page: a banner on top, a menu on the left, text in the middle, a picture on the right and a contact line at the bottom.',
    tags: ['table', 'layout', 'colspan', 'img', 'ul'],
    files: [f('index.html', page('College', `
<table width="100%" cellpadding="8" cellspacing="0">
  <tr bgcolor="#3949ab"><td colspan="3" align="center"><font color="white"><h1>Govt. Polytechnic College</h1><small>Infrastructure</small></font></td></tr>
  <tr valign="top">
    <td width="18%" bgcolor="#e8eaf6"><b>Menu</b>
      <ul><li><a href="#labs">Labs</a></li><li><a href="#library">Library</a></li><li><a href="#sports">Sports</a></li><li><a href="#hostel">Hostel</a></li></ul>
    </td>
    <td>
      <h3 id="labs">Computer Labs</h3><p>Three air-conditioned labs with 90 computers and a projector in each lab.</p>
      <h3 id="library">Library</h3><p>More than 10,000 books, magazines and a digital reading room.</p>
      <h3 id="sports">Sports</h3><p>Cricket ground, basketball court and an indoor games room.</p>
      <h3 id="hostel">Hostel</h3><p>Separate hostels for boys and girls with a mess facility.</p>
    </td>
    <td width="25%"><img src="college.svg" alt="College" width="240"></td>
  </tr>
  <tr bgcolor="#3949ab"><td colspan="3" align="center"><font color="white">Contact: 0755-1234567</font></td></tr>
</table>`))],
  },
  {
    id: 'q20-employee-table', label: 'Q20', topic: 'tables',
    hi: 'Employee data table (rowspan + colspan)', en: 'Employee data',
    question: 'Make an employee table in which each department name is written once and merged across its employees, with a title row spanning all columns.',
    tags: ['table', 'rowspan', 'colspan'],
    files: [f('index.html', page('Employees', `
<table border="1" cellpadding="6" align="center" width="80%">
  <tr bgcolor="saddlebrown" align="center"><th colspan="4"><font color="white">Employee Details - ABC Pvt. Ltd.</font></th></tr>
  <tr bgcolor="rosybrown" align="center"><th>Department</th><th>Emp ID</th><th>Name</th><th>Salary (Rs.)</th></tr>
  <tr><td rowspan="3" align="center"><b>Accounts</b></td><td>E101</td><td>Suresh</td><td align="right">35,000</td></tr>
  <tr><td>E102</td><td>Kavita</td><td align="right">32,000</td></tr>
  <tr><td>E103</td><td>Mohan</td><td align="right">30,000</td></tr>
  <tr><td rowspan="2" align="center"><b>IT</b></td><td>E201</td><td>Ritu</td><td align="right">45,000</td></tr>
  <tr><td>E202</td><td>Imran</td><td align="right">42,000</td></tr>
  <tr><td rowspan="2" align="center"><b>HR</b></td><td>E301</td><td>Sonia</td><td align="right">38,000</td></tr>
  <tr><td>E302</td><td>Deepak</td><td align="right">36,000</td></tr>
</table>`))],
  },
  {
    id: 'q21-layout', label: 'Q21', topic: 'tables',
    hi: 'Page layout (header, nav, main, sidebar, footer)', en: 'Page layout',
    question: 'Lay out a news website page with a header, a navigation bar, a category sidebar, a main area with two articles, an advertisement column and a footer.',
    tags: ['table', 'header', 'nav', 'section', 'article', 'aside', 'footer'],
    files: [f('index.html', page('Layout', `
<table border="1" width="100%" cellpadding="8" cellspacing="0">
  <tr bgcolor="darkorange"><td colspan="3" align="center"><header><h1><font color="white">My News Website</font></h1></header></td></tr>
  <tr bgcolor="bisque"><td colspan="3"><nav><a href="#">Home</a> | <a href="#">India</a> | <a href="#">Sports</a> | <a href="#">Technology</a></nav></td></tr>
  <tr valign="top">
    <td width="20%" bgcolor="blanchedalmond"><aside><b>Categories</b><ul><li>Education</li><li>Science</li><li>Jobs</li></ul></aside></td>
    <td>
      <section>
        <article><h3>New Computer Lab Opened</h3><p>A new computer lab with 40 systems was opened in the college today.</p></article>
        <article><h3>O Level Exam Dates Announced</h3><p>Students can now check the exam schedule on the official website.</p></article>
      </section>
    </td>
    <td width="22%" bgcolor="blanchedalmond"><aside><b>Advertisement</b><p>Join our free HTML workshop this Sunday.</p></aside></td>
  </tr>
  <tr bgcolor="#444"><td colspan="3" align="center"><footer><font color="white">Copyright 2026 My News Website</font></footer></td></tr>
</table>
<p><small>HTML5 tags header, nav, section, article, aside and footer are placed inside table cells to make the layout without CSS.</small></p>`))],
  },
  {
    id: 'q22-tourist-spots', label: 'Q22', topic: 'tables',
    hi: 'भारत के Tourist Spots की table', en: 'Indian tourist spots',
    question: 'Prepare a table of six famous tourist places of India with place, city, state, what it is known for and the best time to visit.',
    tags: ['table', 'th', 'td', 'bgcolor'],
    files: [f('index.html', page('Tourist Spots', `
<table border="1" cellpadding="6" align="center" width="90%">
  <caption><h2><font color="darkgreen">Famous Tourist Spots of India</font></h2></caption>
  <tr bgcolor="forestgreen" align="center"><th><font color="white">S.No.</font></th><th><font color="white">Place</font></th><th><font color="white">City</font></th><th><font color="white">State</font></th><th><font color="white">Famous For</font></th><th><font color="white">Best Time</font></th></tr>
  <tr><td align="center">1</td><td><b>Taj Mahal</b></td><td>Agra</td><td>Uttar Pradesh</td><td>Monument of love, white marble</td><td align="center">Oct - Mar</td></tr>
  <tr bgcolor="honeydew"><td align="center">2</td><td><b>Qutub Minar</b></td><td>Delhi</td><td>Delhi</td><td>Tallest brick minaret</td><td align="center">Oct - Mar</td></tr>
  <tr><td align="center">3</td><td><b>Gateway of India</b></td><td>Mumbai</td><td>Maharashtra</td><td>Arch monument at the sea</td><td align="center">Nov - Feb</td></tr>
  <tr bgcolor="honeydew"><td align="center">4</td><td><b>Khajuraho Temples</b></td><td>Chhatarpur</td><td>Madhya Pradesh</td><td>Ancient temple carvings</td><td align="center">Oct - Mar</td></tr>
  <tr><td align="center">5</td><td><b>Hawa Mahal</b></td><td>Jaipur</td><td>Rajasthan</td><td>Palace of winds</td><td align="center">Oct - Mar</td></tr>
  <tr bgcolor="honeydew"><td align="center">6</td><td><b>Golden Temple</b></td><td>Amritsar</td><td>Punjab</td><td>Holy Sikh shrine</td><td align="center">All year</td></tr>
</table>`))],
  },

  // ---------------- Forms ----------------
  {
    id: 'q23-magazine-form', label: 'Q23', topic: 'forms',
    hi: 'Magazine subscription form', en: 'Magazine subscription form',
    question: 'Create a subscription form for a magazine with text boxes, an address box, radio buttons for the period, drop-down lists, check boxes and submit and clear buttons.',
    tags: ['form', 'input', 'radio', 'select', 'checkbox', 'textarea', 'submit', 'reset'],
    files: [f('index.html', page('Magazine Form', `
<form action="#" method="post">
<table border="1" cellpadding="6" align="center" width="70%">
  <tr bgcolor="purple"><th colspan="2"><font color="white"><h2>Computer Today - Magazine Subscription</h2></font></th></tr>
  <tr><td>Full Name</td><td><input type="text" name="name"></td></tr>
  <tr><td>Email</td><td><input type="email" name="email"></td></tr>
  <tr><td>Mobile</td><td><input type="text" name="mobile" maxlength="10" placeholder="10 digit number"></td></tr>
  <tr><td>Address</td><td><textarea name="address" rows="3" cols="30"></textarea></td></tr>
  <tr><td>Subscription Period</td><td>
    <input type="radio" name="period" value="6m" checked> 6 Months (Rs. 300)<br>
    <input type="radio" name="period" value="1y"> 1 Year (Rs. 550)<br>
    <input type="radio" name="period" value="2y"> 2 Years (Rs. 1000)</td></tr>
  <tr><td>Edition</td><td><select name="edition"><option>Hindi</option><option>English</option></select></td></tr>
  <tr><td>Also send</td><td><input type="checkbox" name="extra" value="ebook"> Free e-book <input type="checkbox" name="extra" value="news"> Weekly newsletter</td></tr>
  <tr><td>Payment Mode</td><td><select name="pay"><option>UPI</option><option>Net Banking</option><option>Cash on Delivery</option></select></td></tr>
  <tr><td colspan="2" align="center"><input type="submit" value="Subscribe"> <input type="reset" value="Clear"></td></tr>
</table>
</form>`))],
  },
  {
    id: 'q24-job-application', label: 'Q24', topic: 'forms',
    hi: 'Job application form (fieldset)', en: 'Job application form',
    question: 'Create a job application form divided into Personal Details and Job Details groups, with date, radio, drop-down, number, check box, file upload and text area fields.',
    tags: ['form', 'fieldset', 'legend', 'input date', 'file', 'select', 'checkbox', 'textarea'],
    files: [f('index.html', page('Job Application', `
<form action="#" method="post">
<table width="80%" align="center" cellpadding="4">
  <tr bgcolor="#0d47a1"><td align="center"><font color="white"><h2>Job Application Form</h2></font></td></tr>
  <tr><td>
    <fieldset>
      <legend><b>Personal Details</b></legend>
      <table cellpadding="4">
        <tr><td>First Name</td><td><input type="text" name="fname"></td></tr>
        <tr><td>Last Name</td><td><input type="text" name="lname"></td></tr>
        <tr><td>Date of Birth</td><td><input type="date" name="dob"></td></tr>
        <tr><td>Gender</td><td><input type="radio" name="g" value="m">Male <input type="radio" name="g" value="f">Female <input type="radio" name="g" value="o">Other</td></tr>
        <tr><td>Email</td><td><input type="email" name="email" size="30"></td></tr>
        <tr><td>Phone</td><td><input type="text" name="phone"></td></tr>
      </table>
    </fieldset>
    <br>
    <fieldset>
      <legend><b>Job Details</b></legend>
      <table cellpadding="4">
        <tr><td>Post Applied For</td><td><select name="post"><option>Web Designer</option><option>Programmer</option><option>Data Entry Operator</option></select></td></tr>
        <tr><td>Qualification</td><td><select name="qual"><option>O Level</option><option>CCC</option><option>Graduate</option></select></td></tr>
        <tr><td>Experience (years)</td><td><input type="number" name="exp" value="0" min="0" max="40" style="width:60px"></td></tr>
        <tr><td>Skills</td><td><input type="checkbox" name="skill" value="html">HTML <input type="checkbox" name="skill" value="css">CSS <input type="checkbox" name="skill" value="py">Python</td></tr>
        <tr><td>Upload Resume</td><td><input type="file" name="resume"></td></tr>
        <tr><td>About Yourself</td><td><textarea name="about" rows="3" cols="35"></textarea></td></tr>
      </table>
    </fieldset>
  </td></tr>
  <tr><td align="center"><input type="submit" value="Apply Now"> <input type="reset" value="Reset"></td></tr>
</table>
</form>`))],
  },
  {
    id: 'q25-user-details-form', label: 'Q25', topic: 'forms',
    hi: 'Name, Age, Email, Mobile, Address form', en: 'Name, Age, Email, Mobile, Address',
    question: 'Build a form that collects name, age, email, mobile number and address, and make the browser check the entries with HTML5 validation attributes.',
    tags: ['form', 'required', 'type=email', 'type=number', 'min', 'max', 'pattern', 'autofocus', 'placeholder'],
    files: [f('index.html', page('User Details', `
<form action="#" method="post">
<table border="1" cellpadding="6" align="center" bgcolor="lightyellow">
  <tr bgcolor="orange"><th colspan="2">Enter Your Details</th></tr>
  <tr><td>Name</td><td><input type="text" name="name" placeholder="Your full name" required autofocus></td></tr>
  <tr><td>Age</td><td><input type="number" name="age" min="1" max="120" required></td></tr>
  <tr><td>Email</td><td><input type="email" name="email" placeholder="name@example.com" required></td></tr>
  <tr><td>Mobile Number</td><td><input type="text" name="mobile" pattern="[6-9][0-9]{9}" title="10 digits starting with 6-9" required></td></tr>
  <tr><td>Address</td><td><textarea name="address" rows="4" cols="30" required></textarea></td></tr>
  <tr><td colspan="2" align="center"><input type="submit" value="Submit"> <input type="reset" value="Reset"></td></tr>
</table>
</form>
<h3>HTML5 validation used in this form</h3>
<ul>
  <li><b>required</b> - field cannot be left empty</li>
  <li><b>type="email"</b> - checks the email format</li>
  <li><b>type="number" min max</b> - age must be between 1 and 120</li>
  <li><b>pattern</b> - mobile must be 10 digits starting with 6-9</li>
  <li><b>autofocus</b> - cursor goes to the Name box when the page opens</li>
</ul>`))],
  },
  {
    id: 'q26-registration-form', label: 'Q26', topic: 'forms',
    hi: 'User registration form', en: 'User registration form',
    question: 'Create a user registration form with username, two password boxes, email, date of birth, gender, state, a slider, a colour picker and a terms check box.',
    tags: ['form', 'password', 'date', 'radio', 'range', 'color', 'checkbox'],
    files: [f('index.html', page('Registration', `
<form action="#" method="post">
<table border="1" cellpadding="6" align="center" width="60%">
  <tr bgcolor="seagreen"><th colspan="2"><font color="white"><h2>User Registration</h2></font></th></tr>
  <tr><td>Username</td><td><input type="text" name="user"></td></tr>
  <tr><td>Password</td><td><input type="password" name="pass"></td></tr>
  <tr><td>Confirm Password</td><td><input type="password" name="pass2"></td></tr>
  <tr><td>Email</td><td><input type="email" name="email"></td></tr>
  <tr><td>Date of Birth</td><td><input type="date" name="dob"></td></tr>
  <tr><td>Gender</td><td><input type="radio" name="g" value="m"> Male <input type="radio" name="g" value="f"> Female</td></tr>
  <tr><td>State</td><td><input type="text" name="state"></td></tr>
  <tr><td>Your HTML level (1-10)</td><td><input type="range" name="level" min="1" max="10" value="5"></td></tr>
  <tr><td>Favourite colour</td><td><input type="color" name="colour" value="#2e7d32"></td></tr>
  <tr><td colspan="2"><input type="checkbox" name="agree"> I agree to the terms and conditions</td></tr>
  <tr><td colspan="2" align="center"><input type="submit" value="Register"> <input type="reset" value="Reset"></td></tr>
</table>
</form>`))],
  },

  // ---------------- Frames ----------------
  {
    id: 'q04-frames-target', label: 'Q4', topic: 'frames',
    hi: 'Frames में target attribute', en: 'target attribute in frames',
    question: 'Split the window into a left menu and a right content area. Clicking a menu link must load that page in the right area.',
    tags: ['frameset', 'frame', 'target', 'name', 'cols'],
    note: 'Frames are obsolete in HTML5, but they are still part of many practical lists. A frame page has a frameset instead of a body.',
    files: [
      f('index.html', `<!DOCTYPE html>
<html>
<head><title>Frames and target</title></head>
<frameset cols="25%,75%">
  <frame src="menu.html" name="menu">
  <frame src="welcome.html" name="main">
</frameset>
</html>`),
      f('menu.html', `<html>
<head><title>Menu</title></head>
<body bgcolor="#1b4a8c">
<h3><font color="white">Menu</font></h3>
<p><a href="welcome.html" target="main"><font color="yellow">Welcome</font></a></p>
<p><a href="html.html" target="main"><font color="yellow">About HTML</font></a></p>
<p><a href="frames.html" target="main"><font color="yellow">About Frames</font></a></p>
</body>
</html>`),
      f('welcome.html', page('Welcome', '<h2>Welcome</h2>\n<p>Click a link in the left frame.</p>')),
      f('html.html', page('HTML', '<h2>About HTML</h2>\n<p>HTML is the language used to make web pages.</p>')),
      f('frames.html', page('Frames', '<h2>About Frames</h2>\n<p>&lt;frameset&gt; divides the browser window into parts. Each part shows a different page.</p>')),
    ],
  },
  {
    id: 'q28-frameset', label: 'Q28', topic: 'frames',
    hi: 'Frameset (दो rows, noresize)', en: 'Frameset',
    question: 'Divide the browser window into two rows of 20% and 80%, and stop the user from resizing the top row.',
    tags: ['frameset', 'rows', 'noresize', 'frame'],
    files: [
      f('index.html', `<!DOCTYPE html>
<html>
<head><title>Frameset</title></head>
<frameset rows="20%,80%">
  <frame src="top.html" noresize="noresize">
  <frame src="bottom.html">
</frameset>
</html>`),
      f('top.html', `<html><body bgcolor="#1b4a8c"><h2 align="center"><font color="white">Question 28 : Frameset (Top Frame)</font></h2></body></html>`),
      f('bottom.html', page('Bottom', '<h3>Bottom Frame</h3>\n<p>The window is divided into two rows using <b>&lt;frameset rows="20%,80%"&gt;</b>.</p>\n<p>The top frame has <b>noresize</b> so the user cannot drag its border.</p>')),
    ],
  },
  {
    id: 'q29-nested-frames', label: 'Q29', topic: 'frames',
    hi: 'दो rows, पहली row में दो columns (nested frameset)', en: 'Two rows, first row in two columns',
    question: 'Divide the window into two rows and then split only the first row into two columns, so three frames are shown.',
    tags: ['frameset', 'nested frameset', 'rows', 'cols'],
    files: [
      f('index.html', `<!DOCTYPE html>
<html>
<head><title>Nested frames</title></head>
<frameset rows="50%,50%">
  <frameset cols="50%,50%">
    <frame src="frame1.html">
    <frame src="frame2.html">
  </frameset>
  <frame src="frame3.html">
</frameset>
</html>`),
      f('frame1.html', `<html><body bgcolor="#ffcdd2"><h2 align="center">Frame 1</h2><p align="center">First row, left column</p></body></html>`),
      f('frame2.html', `<html><body bgcolor="#c8e6c9"><h2 align="center">Frame 2</h2><p align="center">First row, right column</p></body></html>`),
      f('frame3.html', `<html><body bgcolor="#bbdefb"><h2 align="center">Frame 3</h2><p align="center">Second row (full width). This is a <b>nested frameset</b>: rows="50%,50%" and the first row has cols="50%,50%".</p></body></html>`),
    ],
  },
  {
    id: 'q30-six-frames', label: 'Q30', topic: 'frames',
    hi: 'छह frames, पाँच forms', en: 'Six frames with five forms',
    question: 'Make a window of six frames: a menu on the left and five frames showing a login, contact, feedback, search and survey form.',
    tags: ['frameset', 'nested frameset', 'form', 'target'],
    files: [
      f('index.html', `<!DOCTYPE html>
<html>
<head><title>Six frames</title></head>
<frameset cols="20%,80%">
  <frame src="menu.html">
  <frameset rows="50%,50%">
    <frameset cols="33%,33%,34%">
      <frame src="login.html" name="login">
      <frame src="contact.html" name="contact">
      <frame src="feedback.html" name="feedback">
    </frameset>
    <frameset cols="50%,50%">
      <frame src="search.html" name="search">
      <frame src="survey.html" name="survey">
    </frameset>
  </frameset>
</frameset>
</html>`),
      f('menu.html', `<html><body bgcolor="#263238"><h3><font color="white">Forms</font></h3>
<p><a href="login.html" target="login"><font color="yellow">1. Login</font></a></p>
<p><a href="contact.html" target="contact"><font color="yellow">2. Contact</font></a></p>
<p><a href="feedback.html" target="feedback"><font color="yellow">3. Feedback</font></a></p>
<p><a href="search.html" target="search"><font color="yellow">4. Search</font></a></p>
<p><a href="survey.html" target="survey"><font color="yellow">5. Survey</font></a></p></body></html>`),
      f('login.html', `<html><body bgcolor="#e3f2fd"><h3>Login Form</h3><form>User ID<br><input type="text"><br>Password<br><input type="password"><br><br><input type="submit" value="Login"></form></body></html>`),
      f('contact.html', `<html><body bgcolor="#e8f5e9"><h3>Contact Form</h3><form>Name<br><input type="text"><br>Phone<br><input type="text"><br><br><input type="submit" value="Send"></form></body></html>`),
      f('feedback.html', `<html><body bgcolor="#fff3e0"><h3>Feedback Form</h3><form>Rating<br><select><option>Excellent</option><option>Good</option><option>Average</option></select><br>Comments<br><textarea rows="3" cols="20"></textarea><br><input type="submit" value="Submit"></form></body></html>`),
      f('search.html', `<html><body bgcolor="#f3e5f5"><h3>Search Form</h3><form><input type="text" placeholder="Search..."> <input type="submit" value="Go"></form></body></html>`),
      f('survey.html', `<html><body bgcolor="#fffde7"><h3>Survey Form</h3><form>Do you like HTML?<br><input type="radio" name="l">Yes <input type="radio" name="l">No<br><br><input type="submit" value="Vote"></form></body></html>`),
    ],
  },
  {
    id: 'q31-two-frames', label: 'Q31', topic: 'frames',
    hi: 'दो frames (30% / 70%)', en: 'Two frames',
    question: 'Create a window with a 30% left frame and a 70% right frame. A link in the left frame must open another page in the right frame.',
    tags: ['frameset', 'cols', 'target', 'frame'],
    files: [
      f('index.html', `<!DOCTYPE html>
<html>
<head><title>Two frames</title></head>
<frameset cols="30%,70%">
  <frame src="left.html">
  <frame src="right.html" name="rightframe">
</frameset>
</html>`),
      f('left.html', `<html><body bgcolor="#ffe0b2"><h3>Left Frame</h3><p>cols="30%,70%"</p><p><a href="other.html" target="rightframe">Open a page in the right frame</a></p></body></html>`),
      f('right.html', `<html><body><h2>Right Frame</h2><p>This page is shown in the right frame (70% width).</p></body></html>`),
      f('other.html', `<html><body><h2>Another page</h2><p>This page was opened in the right frame using target="rightframe".</p></body></html>`),
    ],
  },
  {
    id: 'q32-audio-video-frames', label: 'Q32', topic: 'frames',
    hi: 'दो frames में audio और video', en: 'Audio and video in two frames',
    question: 'Create two side-by-side frames. One must play an audio clip and the other must play a video clip with controls.',
    tags: ['frameset', 'audio', 'video', 'controls', 'source'],
    files: [
      f('index.html', `<!DOCTYPE html>
<html>
<head><title>Audio and video frames</title></head>
<frameset cols="50%,50%">
  <frame src="audio.html">
  <frame src="video.html">
</frameset>
</html>`),
      f('audio.html', `<html><body bgcolor="#e8eaf6"><h3 align="center">Audio Clip</h3>
<p align="center"><audio controls><source src="clip.wav" type="audio/wav">Your browser does not support audio.</audio></p>
<p align="center">Tag: &lt;audio controls&gt;</p></body></html>`),
      f('video.html', `<html><body bgcolor="#fce4ec"><h3 align="center">Video Clip</h3>
<p align="center"><video controls width="320" poster="poster.svg"><source src="clip.mp4" type="video/mp4">Your browser does not support video.</video></p>
<p align="center">Tag: &lt;video controls&gt;</p></body></html>`),
    ],
  },

  // ---------------- HTML5 ----------------
  {
    id: 's1-html5-elements', label: 'HTML5 1', topic: 'html5',
    hi: 'HTML5 के नए elements', en: 'HTML5 new elements',
    question: 'Show the HTML5 structure tags header, nav, section, article, aside, figure with caption, footer, plus the details/summary widget and the progress and meter bars.',
    tags: ['header', 'nav', 'section', 'article', 'aside', 'footer', 'figure', 'figcaption', 'details', 'summary', 'progress', 'meter'],
    files: [f('index.html', page('HTML5 Elements', `
<header><h1>HTML5 Semantic Elements</h1></header>
<nav><a href="#sec">Section</a> | <a href="#art">Article</a> | <a href="#side">Aside</a> | <a href="#fig">Figure</a></nav>
<section id="sec">
  <h2>&lt;section&gt;</h2>
  <p>A section groups related content, like a chapter.</p>
  <article id="art">
    <h3>&lt;article&gt; : Blog Post</h3>
    <p>An article is complete on its own, like a news story or a blog post.</p>
  </article>
  <aside id="side"><b>&lt;aside&gt;</b> : extra information, like a side note or advertisement.</aside>
  <figure id="fig">
    <img src="college.svg" alt="College" width="270">
    <figcaption>&lt;figure&gt; and &lt;figcaption&gt; : an image with a caption</figcaption>
  </figure>
  <details>
    <summary>&lt;details&gt; : click here to open</summary>
    <p>This hidden text appears when you click the summary.</p>
  </details>
  <p>Progress: <progress value="70" max="100">70%</progress> 70% &nbsp; Disk used: <meter value="0.6">60%</meter></p>
</section>
<footer><small>&lt;footer&gt; : copyright and contact information goes here.</small></footer>`))],
  },
  {
    id: 's2-iframe-embed', label: 'HTML5 2', topic: 'html5',
    hi: 'iframe, audio, video और embed', en: 'Iframe, audio, video, embed',
    question: 'Show a page inside another page with an iframe whose name can be targeted by links, and add audio, video, embed and object elements.',
    tags: ['iframe', 'audio', 'video', 'embed', 'object', 'controls', 'loop', 'muted', 'poster'],
    files: [
      f('index.html', page('Iframe and Embed', `
<h3>&lt;iframe&gt; : a page inside a page</h3>
<iframe src="inner.html" name="box" width="520" height="190"></iframe>
<p>Links can open inside the iframe using its name: <a href="inner.html" target="box">Inner page</a> | <a href="other.html" target="box">Other page</a></p>
<table width="100%" cellpadding="10"><tr valign="top">
  <td><h3>&lt;audio&gt;</h3>
    <audio controls loop><source src="clip.wav" type="audio/wav"></audio>
    <p>Attributes: controls, loop</p></td>
  <td><h3>&lt;video&gt;</h3>
    <video controls muted width="280" poster="poster.svg"><source src="clip.mp4" type="video/mp4"></video>
    <p>Attributes: controls, muted, poster</p></td>
  <td><h3>&lt;embed&gt; and &lt;object&gt;</h3>
    <embed src="logo.svg" width="90" height="90" type="image/svg+xml">
    <object data="go.svg" type="image/svg+xml" width="90" height="90"></object></td>
</tr></table>`)),
      f('inner.html', page('Inner', '<h3>Inner page</h3>\n<p>This page is shown inside an iframe.</p>')),
      f('other.html', page('Other', '<h3>Other page</h3>\n<p>This page also opened inside the same iframe.</p>')),
    ],
  },
  {
    id: 's3-form-validation', label: 'HTML5 3', topic: 'html5',
    hi: 'HTML5 form validation (required, pattern, autofocus)', en: 'HTML5 form validation',
    question: 'Create a form that uses the validation attributes required, pattern, min, max, maxlength, placeholder and autofocus, and try submitting it empty.',
    tags: ['required', 'pattern', 'min', 'max', 'maxlength', 'placeholder', 'autofocus', 'title'],
    files: [f('index.html', page('Validation', `
<form action="#" method="post">
  <p>Name: <input type="text" name="name" required autofocus placeholder="Required field"></p>
  <p>PIN code: <input type="text" name="pin" pattern="[0-9]{6}" title="Enter exactly 6 digits" maxlength="6" required></p>
  <p>Marks (0-100): <input type="number" name="marks" min="0" max="100" required></p>
  <p>Website: <input type="url" name="site" placeholder="https://example.com"></p>
  <p><input type="submit" value="Check"></p>
</form>`))],
  },
  {
    id: 's4-input-types', label: 'HTML5 4', topic: 'html5',
    hi: 'HTML5 input types (email, date, range, color)', en: 'HTML5 input types',
    question: 'Create a form that shows the newer input types: email, url, number, date, time, range, color, search, tel and a datalist.',
    tags: ['input type', 'email', 'url', 'number', 'date', 'time', 'range', 'color', 'search', 'tel', 'datalist'],
    files: [f('index.html', page('Input Types', `
<form action="#" method="post">
<table cellpadding="6">
  <tr><td>Email</td><td><input type="email" name="e"></td></tr>
  <tr><td>URL</td><td><input type="url" name="u"></td></tr>
  <tr><td>Number</td><td><input type="number" name="n" min="1" max="10"></td></tr>
  <tr><td>Date</td><td><input type="date" name="d"></td></tr>
  <tr><td>Time</td><td><input type="time" name="t"></td></tr>
  <tr><td>Range</td><td><input type="range" name="r" min="0" max="100" value="40"></td></tr>
  <tr><td>Color</td><td><input type="color" name="c" value="#e91e63"></td></tr>
  <tr><td>Search</td><td><input type="search" name="s"></td></tr>
  <tr><td>Telephone</td><td><input type="tel" name="p"></td></tr>
  <tr><td>Datalist</td><td><input list="langs" name="l"><datalist id="langs"><option value="HTML"><option value="Python"><option value="JavaScript"></datalist></td></tr>
</table>
</form>`))],
  },
];

export const getPractical = (id) => PRACTICALS.find((p) => p.id === id);
export const practicalsOf = (topicId) => PRACTICALS.filter((p) => p.topic === topicId);
export const mainFile = (p) => p.main || p.files[0].name;

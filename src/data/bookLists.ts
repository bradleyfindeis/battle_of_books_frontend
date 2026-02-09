/**
 * Fallback book lists when GET /book_lists is not available.
 * Remove or bypass once the backend book list API is in place.
 */

export interface BookListEntry {
  author: string;
  title: string;
}

export interface BookListFallback {
  id: string;
  name: string;
  books: BookListEntry[];
}

export const BOOK_LISTS_FALLBACK: BookListFallback[] = [
  {
    id: '3-4-grades-2025-26',
    name: 'Medium 20 Book List 3-4 Grades 2025-26',
    books: [
      { author: 'Arnold, Elana K.', title: 'A Boy Called Bat' },
      { author: 'Bulla, Clyde R.', title: 'The Chalk Box Kid' },
      { author: 'Birney, Betty G.', title: 'Seven Wonders of Sassafras Springs' },
      { author: 'Brown, Peter', title: 'The Wild Robot' },
      { author: 'Byars, Betsy', title: 'Wanted. . . Mud Blossom' },
      { author: 'Coville, Bruce', title: 'Jeremy Thatcher, Dragon Hatcher' },
      { author: 'Creech, Sharon', title: 'Moo' },
      { author: 'Draper, Sharon M.', title: 'Out of My Mind' },
      { author: 'Fagan, Cary', title: 'Wolfie & Fly' },
      { author: 'Guglielmo, Amy', title: 'Pocket Full of Colors' },
      { author: 'Gutman, Dan', title: 'The Million Dollar Shot' },
      { author: 'Hobbs, Will', title: 'Bearstone' },
      { author: 'Kehret, Peg', title: 'Earthquake Terror' },
      { author: 'Levine, Ellen', title: 'Henry\'s Freedom Box: A True Story from the…' },
      { author: 'Look, Lenore', title: 'Alvin Ho: Allergic to Girls, School and Other…' },
      { author: 'Lord, Cynthia', title: 'A Handful of Stars' },
      { author: 'Lowry, Lois', title: 'All About Sam' },
      { author: 'Rappaport, Doreen', title: 'Helen\'s Big World: The Life of Helen Keller' },
      { author: 'Robinson, Barbara', title: 'The Best School Year Ever' },
      { author: 'Tarshis, Lauren', title: 'I Survived the Sinking of the Titanic, 1912' },
    ],
  },
  {
    id: '5-6-grades-2025-26',
    name: 'Medium 20 Book List 5-6 Grades 2025-26',
    books: [
      { author: 'Barnhill, Kelly', title: 'The Girl Who Drank the Moon' },
      { author: 'Creech, Sharon', title: 'Ruby Holler' },
      { author: 'Curtis, Christopher P.', title: 'Bud, Not Buddy' },
      { author: 'DuPrau, Jeanne', title: 'City of Ember: the First Book of Ember' },
      { author: 'Elliott, Zetta', title: 'Dragons in a Bag' },
      { author: 'Haddix, Margaret P', title: 'Found' },
      { author: 'Hale, Nathan', title: 'One Dead Spy: Hazardous Tales #1' },
      { author: 'Hannigan, Katherine', title: 'Ida B…and Her Plans to Maximize Fun…' },
      { author: 'Klise K. & Klise, M. Sarah', title: 'Regarding the Fountain: A Tale, in Letters…' },
      { author: 'LaFaye, A.', title: 'Worth' },
      { author: 'Law, Ingrid', title: 'Savvy' },
      { author: 'Lord, Cynthia', title: 'Rules' },
      { author: 'McSwigan, Marie', title: 'Snow Treasure' },
      { author: 'Morpurgo, Michael', title: 'War Horse' },
      { author: 'Nielsen, Jennifer A.', title: 'The False Prince' },
      { author: 'Paterson, Katherine', title: 'Bridge to Terabithia' },
      { author: 'Rowling, JK', title: 'Harry Potter and the Sorcerer\'s Stone' },
      { author: 'Ruckman, Ivy', title: 'Night of the Twisters' },
      { author: 'Shurtliff, Liesl', title: 'Rump: The (Fairly) True Tale of Rumpelstiltskin' },
      { author: 'Stewart, Whitney', title: 'Who Was Walt Disney' },
    ],
  },
];

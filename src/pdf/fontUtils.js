export function guessFontInfo(rawFontName = '') {
  const cleaned = rawFontName.replace(/^[A-Z]{6}\+/, '');
  const lower = cleaned.toLowerCase();

  let fontWeight = '400';
  if (/black|heavy|900/.test(lower)) fontWeight = '900';
  else if (/extrabold|ultrabold|800/.test(lower)) fontWeight = '800';
  else if (/semibold|demibold|demi|600/.test(lower)) fontWeight = '600';
  else if (/bold|700/.test(lower)) fontWeight = '700';
  else if (/medium|500/.test(lower)) fontWeight = '500';
  else if (/light|300/.test(lower)) fontWeight = '300';
  else if (/thin|hairline|100/.test(lower)) fontWeight = '100';

  const isBold = Number(fontWeight) >= 600;
  const isItalic = /italic|oblique|slant/.test(lower);
  const isEmbeddedSubset =
    /^[A-Z]{6}\+/.test(rawFontName) ||
    (!/helvetica|arial|times|courier|sans|serif|mono/.test(lower) && rawFontName.length > 0);

  let mappedFamily = 'Helvetica';
  if (/arial/.test(lower)) mappedFamily = 'Arial';
  else if (/roboto\s*mono|robotomono/.test(lower)) mappedFamily = 'Roboto Mono';
  else if (/roboto/.test(lower)) mappedFamily = 'Roboto';
  else if (/poppins/.test(lower)) mappedFamily = 'Poppins';
  else if (/inter/.test(lower)) mappedFamily = 'Inter';
  else if (/open\s*sans|opensans/.test(lower)) mappedFamily = 'Open Sans';
  else if (/montserrat/.test(lower)) mappedFamily = 'Montserrat';
  else if (/plus\s*jakarta|jakarta/.test(lower)) mappedFamily = 'Plus Jakarta Sans';
  else if (/space\s*grotesk/.test(lower)) mappedFamily = 'Space Grotesk';
  else if (/times/.test(lower)) mappedFamily = 'Times New Roman';
  else if (/georgia/.test(lower)) mappedFamily = 'Georgia';
  else if (/playfair/.test(lower)) mappedFamily = 'Playfair Display';
  else if (/lora/.test(lower)) mappedFamily = 'Lora';
  else if (/merriweather/.test(lower)) mappedFamily = 'Merriweather';
  else if (/garamond|cormorant/.test(lower)) mappedFamily = 'Cormorant Garamond';
  else if (/jetbrains/.test(lower)) mappedFamily = 'JetBrains Mono';
  else if (/fira\s*code|firacode/.test(lower)) mappedFamily = 'Fira Code';
  else if (/courier/.test(lower)) mappedFamily = 'Courier New';
  else if (/caveat/.test(lower)) mappedFamily = 'Caveat';
  else if (/serif|cambria|palatino/.test(lower)) mappedFamily = 'Times New Roman';
  else if (/mono|consolas|code|menlo/.test(lower)) mappedFamily = 'Courier New';

  return {
    rawFontName,
    mappedFamily,
    fontWeight,
    isBold,
    isItalic,
    isEmbeddedSubset,
  };
}

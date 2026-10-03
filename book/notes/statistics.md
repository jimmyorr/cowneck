# Notes: ch. 16, "Lies, Damned Lies" (`book/statistics.html`)

Prose length: about 3,000 words. There's no formula card. The central idea
(why one test proves little) is explained in prose through the tea-tasting
arithmetic: C(8,4) = 70, so a pure guess gets all eight right with
probability 1/70. There are C(4,3)·C(4,1) = 16 ways to get exactly three of the
four right, so the chance of doing at least that well is 17/70 ≈ 24%, "about
one time in four." Gosset's small-sample problem supports the same idea.

Research note: WebFetch to Wikipedia, MacTutor and arXiv was blocked by the
session's network proxy, so facts were checked with web searches. The search
results quote those same sources (MacTutor, Wikipedia, galton.org, UCL, RSS,
the Florence Nightingale Museum and others). The editing pass may want to
spot-check against the primary pages directly.

## Sources by claim

### Opening: "lies, damned lies and statistics"
- Twain popularized it in "Chapters from My Autobiography," *North American
  Review*, 1907, and attributed it to Disraeli. It isn't found in Disraeli's
  works. The earliest known print appearance is a letter of June 1891.
  Disraeli died in April 1881. Leonard Courtney used a version in 1895.
  Sources: Wikipedia, "Lies, damned lies, and statistics" (and its citations);
  Velleman, *J. Stat. Ed.* 16(2), jse.amstat.org/v16n2/velleman.html.

### Quetelet
- Born in Ghent on 22 Feb 1796; died in Brussels on 17 Feb 1874. Wrote an
  opera with Germinal Dandelin, performed in Ghent in 1816. Published poetry.
  Received the first doctorate awarded by the University of Ghent (1819).
  Lobbied for the Brussels observatory and became its first director (it was
  completed in 1832). Sources: MacTutor biography; Wikipedia; famousscientists.org.
- Chest measurements of 5,738 Scottish soldiers from an Edinburgh medical
  journal (the *Edinburgh Medical and Surgical Journal*, 1817), analyzed by
  Quetelet in 1846. The mean was a little under 40 in (about 39.8). Sources:
  R `HistData::ChestSizes` documentation; Todd Rose, *The End of Average*, as
  excerpted in *The Atlantic*. Stigler has noted transcription errors in
  Quetelet's table. The text only says "a little under forty inches."
- Average man as the true type, with individuals as "errors." Sources: *The
  Atlantic* / Rose; MacTutor.
- "Budget… paid with frightful regularity… prisons, galleys and scaffolds,"
  from *Sur l'homme* (1835). I paraphrase it rather than quoting it, because
  the English translations vary. Sources: MacTutor "Adolphe Quetelet on
  crime"; Quetelet 1831 crime PDF (datavis.ca); PMC4559562.
- Constancy of murders by weapon type: in Quetelet's crime studies, as
  discussed by Hacking (*The Taming of Chance*) and MacTutor's crime extract.
  It's well attested, but I didn't confirm the exact table myself.
- Conscripts: about 100,000 French conscripts, with a deficit just above the
  minimum height and an excess just below it, interpreted as fraud. Source:
  USU Stats History page on Quetelet; Galton, *Hereditary Genius*, which
  discusses Quetelet's tables. Many accounts give a figure of about 2,000
  evaders. I didn't use it because I couldn't verify it.
- Quetelet index → "body mass index," renamed by Ancel Keys in 1972. Sources:
  multiple, including the IEEE topic page and BMI history summaries.

### Nightingale
- Born in Florence in 1820; died in 1910, aged 90. Educated at home by her
  father, including mathematics. Source: Wikipedia; encyclopediaofmath.org.
- The owl Athena was rescued at the Parthenon (1850), carried in her pocket,
  stuffed after it died, and is on display at the Florence Nightingale Museum.
  Source: Florence Nightingale Museum collection highlights;
  florence-nightingale.co.uk. The story that the owl died just as she left for
  the Crimea is common, but I didn't use it.
- Arrived at Scutari in November 1854. Disease deaths were about ten times
  wound deaths. The death rate was 42.7% in February 1855. The Sanitary
  Commission arrived in March 1855. In the week of 14 April 1855 it removed
  215 handcarts of filth, flushed the sewers 19 times and buried two horses,
  a cow and four dogs. The rate was 2.2% by June 1855. Sources: Wikipedia
  (Florence Nightingale, Crimean War section); uvm.edu Nightingale page.
  Credit for the fall is properly the Commission's. The text attributes the
  drains to the Commission and doesn't claim Nightingale cut the death rate.
- Polar-area ("rose"/"coxcomb") diagram in *Notes on Matters Affecting the
  Health, Efficiency, and Hospital Administration of the British Army* (1858).
  The text says she didn't invent the circular chart, because earlier polar
  diagrams exist (e.g. Guerry). Sources: Lehigh Library exhibit; Wikipedia,
  "Pie chart."
- First female member of the Statistical Society of London in 1858, with Farr
  among the signatories of her nomination. Source: RSS, "Nightingale 2020: the
  bicentenary of our first female fellow." Some secondary sources say 1859;
  the RSS says 1858.
- "To understand God's thoughts we must study statistics…" is a third-person
  summary of her views in Karl Pearson, *Life, Letters and Labours of Francis
  Galton*, vol. 2 (1924), ch. 13. It's misquoted as her own first-person words.
  Sources: MacTutor Nightingale quotations page; Wikiquote, as reflected in
  search results. Whether the paraphrase is Galton's or Pearson's wording
  isn't clear, so the text says it "comes from a summary of her opinions…
  in Karl Pearson's biography of Francis Galton."
- 1891 Nightingale–Galton correspondence about an Oxford professorship of
  statistics, which came to nothing. Source: Oxford Statistics Department
  history PDF; galton.org scans of Pearson vol. 2.
- Illness and confinement to bed from 1857. Source: Wikipedia; artlark.org,
  "Florence Nightingale's dark decade."
- Cut for length: Hugh Small (*Florence Nightingale: Avenging Angel*, 1998)
  argues that her own statistics later showed her Scutari's role in the deaths
  and that the guilt caused her breakdown. Critics (NYRB exchange, 2001)
  dispute his numbers. The editing pass could restore it as a hedged sentence.

### Galton
- Born in Birmingham in 1822; died in 1911. Half-cousin of Darwin, through
  their shared grandfather Erasmus Darwin. Source: MacTutor; Science Museum
  Group. The family were bankers and former gun manufacturers; I removed
  "Quaker" because I wasn't sure it applied to Francis's own generation.
- Letter to his sister Adele the day before his fifth birthday, in which the 9
  is erased with a penknife and the 11 covered with pasted paper. Source:
  Pearson, *Life, Letters and Labours*, vol. 1 (galton.org scans).
- 1872, "Statistical Inquiries into the Efficacy of Prayer," *Fortnightly
  Review*, using Guy's longevity tables: sovereigns were the shortest-lived of
  the affluent classes. Source: galton.org essay text.
- "The Measure of Fidget," *Nature* 32 (1885), 174–5. About 50 people per
  sector, about 45 movements per minute, at Royal Geographical Society
  meetings. Source: galton.org; Futility Closet.
- Beauty map: a needle "mounted as a pricker" and paper torn into a cross
  (top good, arm medium, bottom bad). "I found London to rank highest for
  beauty; Aberdeen lowest." Source: Galton, *Memories of My Life* (1908),
  Gutenberg #78669 and galton.org scans. The text paraphrases this.
- Cut for length but verified: the first newspaper weather map (*The Times*,
  1 April 1875) and fingerprint odds of 1 in about 64 billion (*Finger
  Prints*, 1892). Sources: galton.org meteorology page; Scientific American.
- Sweet peas in 1875, sent to seven friends; "regression towards mediocrity"
  (1886 family heights paper). Source: Stanton, *J. Stat. Ed.* 9(3),
  "Galton, Pearson, and the Peas."
- Ox: "Vox Populi," *Nature*, 7 March 1907. West of England Fat Stock and
  Poultry Exhibition, Plymouth, 1906. Sixpenny tickets; 800 entries, 13
  illegible, leaving 787. Median ("middlemost") 1,207 lb; dressed weight
  1,198 lb. The mean of 1,197 lb was given in Galton's follow-up letter after
  a correspondent computed 1,196. "More creditable to the trustworthiness of
  a democratic judgment than might have been expected": Galton's wording,
  quoted. Sources: Wallis, "Revisiting Francis Galton's Forecasting
  Competition," *Statistical Science* 29 (2014); Raban, NYRB 2010; galton.org.
  Galton was 84 in 1906 (born February 1822).
- **The outline's lead says Galton "analyzed guesses of an ox's weight… (1907;
  verify the figures)."** The article is from 1907 but the fair was in 1906.
  Galton's article reported the *median*, not the mean. The famous "mean was
  almost exactly right" figure came later, in correspondence. Wallis notes that
  the organizer's letter gave the dressed weight as 1,197, so mean and outcome
  coincide exactly on that figure. The text keeps Galton's 1,198 and says the
  average was 1,197.
- Eugenics: the word was coined in *Inquiries into Human Faculty* (1883);
  *Hereditary Genius* (1869) followed his 1865 *Macmillan's* articles. Sources:
  eugenicsarchive.org; MacTutor.
- *Hereditary Genius* ranked races ("the average intellectual standard of the
  negro race is some two grades below our own"). I paraphrase rather than
  quote this. Source: galton.org text of *Hereditary Genius*; theoriesofrace.com.
- "Africa for the Chinese," letter to *The Times*, 5 June 1873. Source:
  galton.org letters.
- *The Eugenic College of Kantsaywhere*, rejected by a publisher in December
  1910. His niece Millicent Galton Lethbridge was told to destroy it and cut
  passages out with scissors instead. UCL published the remains in 2011.
  Source: UCL Library / UCL News 2011.
- UCL denamed the Galton Lecture Theatre, the Pearson Lecture Theatre and the
  Pearson Building on 19 June 2020. Source: UCL News, June 2020.

### Eugenics consequences
- Indiana passed the first compulsory sterilization law in 1907. *Buck v. Bell*
  was decided on 2 May 1927, with Holmes's "three generations of imbeciles are
  enough." More than 60,000 people were sterilized in the US by about 1963.
  Germany's Law for the Prevention of Hereditarily Diseased Offspring was
  passed on 14 July 1933; about 350,000–400,000 people were sterilized from
  1934 to 1945. It drew on Laughlin's Model Law. Sources: Wikipedia, *Buck
  v. Bell*; eugenicsarchive.org essay on sterilization laws; USHMM
  newspapers / "Deadly Medicine"; NHGRI symposium (Stern).
- I put the link from sterilization to the T4 killings and the camps as "one
  of the roads," which is the USHMM's framing. I avoided a direct causal
  claim about Galton and wrote "not all of it can be laid at his door."

### Gosset
- Joined Guinness in Dublin in 1899 (he had studied chemistry and mathematics
  at Oxford). Guinness recruited Oxbridge science graduates. Sources:
  Wikipedia; MacTutor.
- Publication ban after an earlier employee leaked trade secrets. La Touche
  allowed publication as "Pupil" or "Student." Source: Wikipedia, citing
  E. S. Pearson.
- *Biometrika* 1908, "The probable error of a mean." The card experiment used
  MacDonell's measurements (height and left middle finger) of 3,000
  criminals, on cards that were shuffled and drawn in 750 samples of 4.
  Source: R `datasets::crimtab` documentation, quoting Student (1908).
- His 1907 yeast/haemacytometer paper rederived the Poisson distribution. I
  didn't use this.
- Fly-fishing remark, as paraphrased in the text ("only the size and general
  lightness or darkness of a fly were important…"), and "Fisher would have
  discovered it all anyway." Source: MacTutor Gosset biography, which quotes
  from Pearson/McMullen's memoir. The text attributes the fishing view to "a
  friend" and paraphrases it.
- Park Royal head brewer in 1935; died 16 Oct 1937 (born 13 June 1876, so
  aged 61). Source: Wikipedia.
- Not used: his 1924 letter to Fisher, "I am sending you a copy of Student's
  Tables as you are the only man that's ever likely to use them!" Source:
  Wikipedia, citing Box.

### Fisher
- Born in East Finchley, London, on 17 Feb 1890; died in Adelaide on
  29 July 1962. Wasn't allowed to read by electric light and was tutored in
  mathematics in the evenings without pencil or paper. Sources: University of
  Adelaide Fisher biography; MacTutor.
- Joined Rothamsted in 1919, choosing it over Pearson's offer. Source: MacTutor.
- Lady tasting tea: Muriel Bristol, an algologist, at Rothamsted. William
  Roach said "Let's test her." The design is reported in *The Design of
  Experiments* (1935), ch. 2, with 8 cups, 4 of each kind. Fisher's book
  doesn't report her result. Roach is reported as saying she "divined
  correctly more than enough of those cups… to prove her case." Roach married
  Bristol. Sources: Wikipedia, "Muriel Bristol" and "Lady tasting tea" (which
  cite Joan Fisher Box, *R. A. Fisher: The Life of a Scientist*, 1978);
  Science History Institute, *Distillations*. **Outline check:** the outline
  names her correctly. Many retellings say she got all eight right, but the
  record supports only Roach's "more than enough." The text says "is said to
  have announced that she got enough right."
- "The value for which P = .05, or 1 in 20, is 1.96 or nearly 2; it is
  convenient to take this point as a limit…" Source: *Statistical Methods for
  Research Workers* (1925), York University Classics in the History of
  Psychology, ch. 5. The text paraphrases this.
- 1933: Galton Chair of Eugenics at UCL, with the department split and Egon
  Pearson heading Applied Statistics. The tea-shift story (Pearson's group at
  4, Fisher's at 4:30) is hedged with "are said to." It comes from accounts
  quoted on the MacTutor Egon Pearson page / Salsburg. Sources: MacTutor
  (Fisher; Egon Pearson); University of Adelaide exhibition.
- Fisher–Pearson dispute, from 1917. Source: MacTutor.
- Eugenics: a founder member of the Cambridge University Eugenics Society
  (1911). Campaigned for family allowances weighted toward the middle and upper
  classes. Had 2 sons and 7 daughters (9 children, one of whom died in
  infancy). Sources: philpapers (Aylward, "R.A. Fisher, eugenics, and the
  campaign for family allowances"); Adelaide biography; MacTutor. The text
  says "since his student days at Cambridge" and doesn't name the society.
- UNESCO 1950/51: his objection that groups differ "in their innate capacity
  for intellectual and emotional development." That is quoted from UNESCO's
  *The Race Concept* (1952) and the *New Statesman*, "R.A. Fisher and the
  science of hatred" (July 2020). The text paraphrases it in reported speech
  that stays close to the wording.
- 1948 letter supporting Otmar von Verschuer, who received specimens from
  Mengele at Auschwitz. Sources: *New Statesman* 2020; USHMM "Deadly
  Medicine" profiles. A defense of Fisher's letter exists at
  historyreclaimed.co.uk. The text states only the facts.
- Gonville and Caius window: installed in 1989; removal announced on 24 June
  2020. Source: Wikipedia, "Sir Ronald Fisher window."
- Consultant to the Tobacco Manufacturers' Standing Committee; "Cigarettes,
  Cancer and Statistics" (*Centennial Review*, 1958); *Smoking: The Cancer
  Controversy* (1959). Source: York histstat; Adelaide digital library. He
  is widely described as a pipe smoker, but I cut that because I didn't
  confirm it with a good source.
- Not used: the "post-mortem" quote (verified: Presidential Address, First
  Indian Statistical Congress, 1938).

## Unverified or hedged claims

1. **Disraeli quote:** presented as unfound in Disraeli's work, with the
   earliest print date of 1891. This is solid. The original author remains
   unknown.
2. **Nightingale's "God's thoughts" line:** presented as a third-person
   summary in Pearson's Galton biography, not her words. Whether the wording
   is Galton's or Pearson's is unclear, and the text avoids saying.
3. **Ox mean:** "When a reader… asked about the ordinary average, Galton
   supplied it." This simplifies the exchange: a correspondent computed 1,196
   and Galton corrected it to 1,197. The dressed weight was 1,198 per Galton
   and 1,197 per the organizer (Wallis).
4. **Tea-tasting result:** hedged with "is said to have announced." The
   text says Fisher's book "coyly never says how she did."
5. **UCL tea shifts:** hedged with "are said to." The anecdote is repeated in
   statistics histories, but I couldn't trace it to a first-hand source.
6. **Murders by weapon type constant:** stated plainly from Quetelet's crime
   statistics. It's well known (Hacking), but I didn't read the original table.
7. **Gosset's fishing view:** attributed to "a friend" and paraphrased.
8. **Galton's beauty-map categories:** the text says "attractive… middling…
   unattractive." Galton's own words were "good," "medium," "bad," and
   elsewhere "attractive, indifferent, or repellent." This is a paraphrase.
9. **US sterilization total:** "more than 60,000" is the conservative standard
   figure (to about 1963). Some estimates are higher.

## Bryson check
- *A Short History of Nearly Everything* doesn't, to my knowledge, tell
  Quetelet, Nightingale's statistics, Galton's ox, Gosset or the tea test.
  Darwin is kept to one clause ("which is as much as we shall say about
  that"). Bryson's *The Body* discusses Ancel Keys and, I believe, BMI. The
  BMI mention here is a single clause about Quetelet's index being renamed,
  with no shared phrasing, but the editing pass may want to cut it if that
  overlap matters.
- The opening's Twain/Disraeli material is commonplace and not, as far as I
  know, a Bryson set piece.

## Ownership
- Pearson appears only as Galton's biographer and Fisher's enemy. He isn't
  assigned to any chapter in the outline.
- Darwin is one clause. Mendel isn't mentioned (Fisher's 1936 "too good to be
  true" analysis was left out to stay clear of genetics and evolution).
- Probability (Pascal, Fermat, dice) isn't retold.

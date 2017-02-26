function normalSqrt()
{
  for(j=0;j<1;j++)
  {
    Math.sqrt(Math.random());
  }
}

function fastSqrt()
{
  var guess = 10.;
  var its=4;
  var newguess;

  for(j=0;j<1;++j)
  {
    val=Math.random();
    for(i=0;i<its;++i)
    {
      newguess = guess - ((guess*guess) - val)/(2*guess);
      guess=newguess;
    }
  }
  // console.log(guess);
}

function init() 
{
  console.time('someFunction');
  fastSqrt(200);
  console.timeEnd('someFunction');

  console.time('someFunction');
  normalSqrt(200);
  console.timeEnd('someFunction');
}

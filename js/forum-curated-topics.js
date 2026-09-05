const CURATED_TOPIC_ORDER = Object.freeze([
  '0a54560a-c026-43c6-a075-3018a9ae58bd',
  '14245efd-6b0e-43d6-bc7c-430cda0d12d1',
  '2b3e47a0-e4fa-465b-a0b1-2a530bedae63',
  '27da2687-b3c4-44be-bf95-685207ff2778',
  '2c154ba4-2a13-4a49-bae0-f9009194f56c',
  '4a6654fd-a2c6-4f3a-9e5f-fc8980ce4610'
]);

const topicList = document.querySelector('#forum-topics');
const order = new Map(CURATED_TOPIC_ORDER.map((id, index) => [id, index + 1]));

function applyCuratedTopicView() {
  if (!topicList) return;
  const cards = [...topicList.querySelectorAll('.forum-topic')];
  if (!cards.length) return;

  const visible = cards.filter((card) => {
    const link = card.querySelector('h4 a[href*="forum-topic.html?id="]');
    const match = link?.href.match(/[?&]id=([^&]+)/);
    return match && order.has(decodeURIComponent(match[1]));
  });

  cards.forEach((card) => { card.hidden = !visible.includes(card); });
  visible.sort((a, b) => order.get(getId(a)) - order.get(getId(b))).forEach((card, index) => {
    const heading = card.querySelector('h4');
    if (!heading) return;
    let number = heading.querySelector('.forum-topic-number');
    if (!number) {
      number = document.createElement('span');
      number.className = 'forum-topic-number';
      number.setAttribute('aria-hidden', 'true');
      heading.prepend(number, document.createTextNode(' '));
    }
    number.textContent = `${index + 1}.`;
    topicList.appendChild(card);
  });
}

function getId(card) {
  const link = card.querySelector('h4 a[href*="forum-topic.html?id="]');
  const match = link?.href.match(/[?&]id=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

if (topicList) {
  const observer = new MutationObserver(applyCuratedTopicView);
  observer.observe(topicList, { childList: true, subtree: true });
  applyCuratedTopicView();
}

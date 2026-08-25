import type { InvitationContent } from "@/core/domain";
// 최종적으로 InvitationMessage 컴포넌트가 받을 props 타입
interface Contact {
  relation: string;
  name: string;
  phone: string;
}

interface ParentName {
  label: string;
  name: string;
}

interface Party {
  parents: ParentName[];
  name: string;
  title: string;
  contacts: Contact[];
}

export interface InvitationMessageMappedProps {
  parties: Party[];
}

type CoupleSide = InvitationContent["groom"];
type Parent = NonNullable<CoupleSide["father"]>;

// 헬퍼 함수 1: 부모/신랑/신부 정보를 Contact 타입으로 변환
function createContact(
  person: CoupleSide | Parent | undefined,
  relation: string,
): Contact | undefined {
  if (!person?.name || !person.phone) {
    return undefined;
  }
  return {
    relation,
    name: person.name,
    phone: person.phone,
  };
}

// 헬퍼 함수 2: 부모님 이름 목록 생성
function getParentNames(parents: CoupleSide): ParentName[] {
  const list: ParentName[] = [];
  if (parents.father?.name) {
    list.push({ label: "아버님", name: parents.father.name });
  }
  if (parents.mother?.name) {
    list.push({ label: "어머님", name: parents.mother.name });
  }
  return list;
}

/**
 * coupleInfoData를 받아 InvitationMessage 컴포넌트의 props를 생성하는 매퍼 함수
 * @param coupleInfoData - 청첩장 콘텐츠
 * @returns InvitationMessage 컴포넌트가 필요로 하는 `parties` 배열을 포함한 객체
 */
export function mapCoupleInfoToInvitationProps(
  coupleInfoData: InvitationContent,
): InvitationMessageMappedProps {
  // 1. 신랑측 연락처 배열 생성
  const groomSideContacts = [
    createContact(coupleInfoData.groom, "신랑"),
    createContact(coupleInfoData.groom.father, "신랑측 아버님"),
    createContact(coupleInfoData.groom.mother, "신랑측 어머님"),
  ].filter((contact): contact is Contact => !!contact);

  // 2. 신부측 연락처 배열 생성
  const brideSideContacts = [
    createContact(coupleInfoData.bride, "신부"),
    createContact(coupleInfoData.bride.father, "신부측 아버님"),
    createContact(coupleInfoData.bride.mother, "신부측 어머님"),
  ].filter((contact): contact is Contact => !!contact);

  // 3. UI 표시에 필요한 최종 데이터 배열 조립
  const displayParties: Party[] = [
    {
      parents: getParentNames(coupleInfoData.groom),
      name: coupleInfoData.groom.name,
      title: "신랑",
      contacts: groomSideContacts,
    },
    {
      parents: getParentNames(coupleInfoData.bride),
      name: coupleInfoData.bride.name,
      title: "신부",
      contacts: brideSideContacts,
    },
  ];

  return { parties: displayParties };
}

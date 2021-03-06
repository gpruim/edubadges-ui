export const staffType = {
  INSTITUTION_STAFF: "institution_staff",
  ISSUER_GROUP_STAFF: "issuer_group_staff",
  ISSUER_STAFF: "issuer_staff",
  BADGE_CLASS_STAFF: "badge_class_staff",
  USER_PROVISIONMENT: "user_provisionment",
  BADGE_CLASS_OWNER: "badge_class_owner",
  BADGE_CLASS_EDITOR: "badge_class_editor",
  BADGE_CLASS_AWARDER: "badge_class_awarder",
  VIEWER: "viewer"
};

export const addStaffType = (users, type) => users.map(user => {
  user._staffType = type;
  return user;
});

export const expandStaffsBadgeClass = (institutionStaff, issuerGroupStaffs, issuerStaffs, badgeClassStaffs) => {
  let staffs = [];

  if (institutionStaff.length > 0) {
    for (const faculty of institutionStaff[0].institution.faculties){
      for (const issuer of faculty.issuers) {
        for (const badgeClass of issuer.badgeclasses) {
          staffs = [{badgeClass, _staffType: staffType.INSTITUTION_STAFF, role: staffType.INSTITUTION_STAFF}, ...staffs];
        }
      }
    }
  }

  if (issuerGroupStaffs.length > 0) {
    for (const issuerGroupStaff of issuerGroupStaffs) {
      for (const issuer of issuerGroupStaff.faculty.issuers) {
        for (const badgeClass of issuer.badgeclasses) {
          staffs = [{badgeClass, _staffType: staffType.ISSUER_GROUP_STAFF, role: staffType.ISSUER_GROUP_STAFF}, ...staffs];
        }
      }
    }
  }

  if (issuerStaffs.length > 0) {
    for (const issuerStaff of issuerStaffs) {
      for (const badgeClass of issuerStaff.issuer.badgeclasses) {
        staffs = [{badgeClass, _staffType: staffType.ISSUER_STAFF, role: staffType.ISSUER_STAFF}, ...staffs];
      }
    }
  }

  if (badgeClassStaffs.length > 0) {
    for (const badgeClassStaff of badgeClassStaffs) {
      staffs = [{
        badgeClass: badgeClassStaff.badgeclass,
        _staffType: staffType.BADGE_CLASS_STAFF,
        mayAdministrateUsers: badgeClassStaff.mayAdministrateUsers,
        mayUpdate: badgeClassStaff.mayUpdate,
        mayAward: badgeClassStaff.mayAward,
        staffId: badgeClassStaff.entityId,
        role: badgeClassStaff.mayAdministrateUsers ? staffType.BADGE_CLASS_OWNER :
            badgeClassStaff.mayUpdate ? staffType.BADGE_CLASS_EDITOR :
            badgeClassStaff.mayAward ? staffType.BADGE_CLASS_AWARDER : '',
      }, ...staffs];
    }
  }

  return staffs;
};

export const expandStaffsIssuer = (institutionStaff, issuerGroupStaffs, issuerStaffs) => {
  let staffs = [];

  if (institutionStaff.length > 0) {
    for (const faculty of institutionStaff[0].institution.faculties){
      for (const issuer of faculty.issuers) {
        staffs = [{issuer, _staffType: staffType.INSTITUTION_STAFF, role: staffType.INSTITUTION_STAFF}, ...staffs];
      }
    }
  }

  if (issuerGroupStaffs.length > 0) {
    for (const issuerGroupStaff of issuerGroupStaffs) {
      for (const issuer of issuerGroupStaff.faculty.issuers) {
        staffs = [{issuer, _staffType: staffType.ISSUER_GROUP_STAFF, role: staffType.ISSUER_GROUP_STAFF}, ...staffs];
      }
    }
  }

  if (issuerStaffs.length > 0) {
    for (const issuerStaff of issuerStaffs) {
      staffs = [{issuer: issuerStaff.issuer, _staffType: staffType.ISSUER_STAFF, role: staffType.ISSUER_STAFF, staffId: issuerStaff.entityId}, ...staffs];
    }
  }

  return staffs;
};

export const expandStaffsIssuerGroup = (institutionStaff, issuerGroupStaffs) => {
  let staffs = [];

  if (institutionStaff.length > 0) {
    for (const faculty of institutionStaff[0].institution.faculties){
      staffs = [{issuerGroup: faculty, _staffType: staffType.INSTITUTION_STAFF, role: staffType.INSTITUTION_STAFF}, ...staffs];
    }
  }

  if (issuerGroupStaffs.length > 0) {
    for (const issuerGroupStaff of issuerGroupStaffs) {
      staffs = [{issuerGroup: issuerGroupStaff.faculty, _staffType: staffType.ISSUER_GROUP_STAFF, role: staffType.ISSUER_GROUP_STAFF, staffId: issuerGroupStaff.entityId}, ...staffs];
    }
  }

  return staffs;
};
